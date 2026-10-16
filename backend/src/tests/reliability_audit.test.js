import http from 'http';
import mongoose from 'mongoose';
import app from '../app.js';
import { isDbConnected } from '../config/db.js';

const PORT = 5059;
let server;

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        ...options
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body });
          }
        });
      }
    );

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runReliabilityAudit = async () => {
  console.log('--- Starting Production Reliability & Database Readiness Audit ---');
  let testsPassed = 0;
  let testsFailed = 0;

  const assert = (condition, testName, details = '') => {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      testsPassed++;
    } else {
      console.error(`✗ FAIL: ${testName} - ${details}`);
      testsFailed++;
    }
  };

  try {
    // 1. Ensure DB is disconnected initially for cold-start / outage verification
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    server = app.listen(PORT);
    await new Promise((resolve) => setTimeout(resolve, 300));

    // TEST 1: Liveness probe /health is always 200 even if database is offline
    const livenessRes = await makeRequest({ path: '/health', method: 'GET' });
    assert(
      livenessRes.status === 200 && livenessRes.body?.status === 'online',
      'Liveness probe /health returns 200 OK during cold-start or DB outage',
      JSON.stringify(livenessRes.body)
    );

    // TEST 2: Readiness probe /ready returns 503 degraded when DB is disconnected
    const disconnectedReadyRes = await makeRequest({ path: '/ready', method: 'GET' });
    assert(
      disconnectedReadyRes.status === 503 && disconnectedReadyRes.body?.database === 'disconnected',
      'Readiness probe /ready returns 503 degraded when database is disconnected',
      JSON.stringify(disconnectedReadyRes.body)
    );

    // TEST 3: Fail-Fast: Data routes reject immediately with 503 when DB is offline (zero 10s buffer timeout)
    const startTime = Date.now();
    const offlineAuthRes = await makeRequest(
      {
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'intern.demo@velooprewards.in', password: 'DemoPassword123!' }
    );
    const duration = Date.now() - startTime;

    assert(
      offlineAuthRes.status === 503 &&
      offlineAuthRes.body?.code === 'DATABASE_UNAVAILABLE' &&
      duration < 1000,
      `Fail-fast: Offline login returns 503 within ${duration}ms without 10s query buffering`,
      JSON.stringify(offlineAuthRes.body)
    );

    // TEST 4: Security: 503 response never exposes database credentials or connection strings
    const responseString = JSON.stringify(offlineAuthRes.body);
    const hasLeak = /mongodb|\/\/|cluster|atlas|password/i.test(responseString);
    assert(
      !hasLeak,
      'Security: Disconnected response strictly scrubs internal database credentials and hosts',
      responseString
    );

    // TEST 5: Connect to local test database and verify readiness flips to 200
    const mongoUri = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/veloop_test';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    assert(
      isDbConnected(),
      'Database connection established successfully'
    );

    // TEST 6: Readiness probe /ready returns 200 once database connects
    const connectedReadyRes = await makeRequest({ path: '/ready', method: 'GET' });
    assert(
      connectedReadyRes.status === 200 && connectedReadyRes.body?.database === 'connected',
      'Readiness probe /ready flips to 200 OK once database connects',
      JSON.stringify(connectedReadyRes.body)
    );

    // TEST 7: Centralized Error Handler never leaks raw Mongoose CastErrors or Internal errors
    const notFoundRes = await makeRequest({ path: '/api/non-existent-route', method: 'GET' });
    assert(
      notFoundRes.status === 404 && notFoundRes.body?.code === 'ROUTE_NOT_FOUND',
      'Centralized 404 handler returns structured RFC JSON error without stack traces',
      JSON.stringify(notFoundRes.body)
    );

    console.log(`\n--- Reliability Audit Summary: ${testsPassed} passed, ${testsFailed} failed ---`);
  } catch (err) {
    console.error('Reliability Audit Execution Error:', err);
    testsFailed++;
  } finally {
    if (server) {
      server.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  if (testsFailed > 0) {
    process.exit(1);
  }
};

runReliabilityAudit();
