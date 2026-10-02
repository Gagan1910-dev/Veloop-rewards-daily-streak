import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import app from '../app.js';

const PORT = 5059;
let server;

const makeRequest = (targetApp, path, options = {}) => {
  return new Promise((resolve, reject) => {
    const testPort = options.port || PORT;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: testPort,
        path,
        method: options.method || 'GET',
        headers: options.headers || {}
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, headers: res.headers, body: parsed });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, body });
          }
        });
      }
    );

    req.on('error', reject);
    if (options.postData) {
      req.write(typeof options.postData === 'string' ? options.postData : JSON.stringify(options.postData));
    }
    req.end();
  });
};

const runRateLimitTests = async () => {
  console.log('--- Starting VELoop API Rate Limiting Verification Suite ---');
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
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/veloop_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    }

    server = app.listen(PORT);

    // Test 1: Health check endpoint /health is active and returns 200
    const healthRes = await makeRequest(app, '/health');
    assert(
      healthRes.status === 200 && healthRes.body?.success === true,
      'Health check /health is active and exempt from auth/claim restrictions'
    );

    // Test 2: Health check endpoint /api/health is accessible
    const apiHealthRes = await makeRequest(app, '/api/health');
    assert(
      apiHealthRes.status === 200 && apiHealthRes.body?.status === 'online',
      'API Health check /api/health returns 200 online status'
    );

    // Test 3: Standard app in NODE_ENV=test bypasses rate limiter
    process.env.NODE_ENV = 'test';
    const testBypassRes = await makeRequest(app, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      postData: { email: 'invalid@test.com', password: 'wrong' }
    });
    // Should get validation or 401 response from controller, NOT a 429 rate limit
    assert(
      testBypassRes.status === 400 || testBypassRes.status === 401,
      'NODE_ENV=test bypasses rate limiter to prevent test suite interference'
    );

    // Test 4: Isolated active rate limiter enforcing max limit and HTTP 429 response
    const mockApp = express();
    mockApp.set('trust proxy', 1);
    const isolatedLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 3,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' }
    });
    mockApp.use('/test-limit', isolatedLimiter, (req, res) => res.json({ ok: true }));

    const mockServer = mockApp.listen(5060);

    const r1 = await makeRequest(mockApp, '/test-limit', { port: 5060 });
    const r2 = await makeRequest(mockApp, '/test-limit', { port: 5060 });
    const r3 = await makeRequest(mockApp, '/test-limit', { port: 5060 });
    const r4 = await makeRequest(mockApp, '/test-limit', { port: 5060 });

    assert(
      r1.status === 200 && r2.status === 200 && r3.status === 200,
      'Requests within threshold (1-3 of 3) succeed with 200 OK'
    );

    assert(
      r4.status === 429 && r4.body?.code === 'RATE_LIMIT_EXCEEDED',
      'Requests exceeding threshold (4th of 3) receive HTTP 429 and RATE_LIMIT_EXCEEDED code'
    );

    // Test 5: Rate limit headers verification
    const hasRateLimitHeader = Boolean(
      r1.headers['ratelimit-limit'] ||
      r1.headers['ratelimit-remaining'] ||
      r1.headers['ratelimit-policy'] ||
      r4.headers['ratelimit-reset'] ||
      r4.headers['retry-after']
    );
    assert(hasRateLimitHeader, 'Rate limit response contains standard RFC / draft-8 rate-limit headers');

    await new Promise((resolve) => mockServer.close(resolve));

    console.log(`\n--- Rate Limiting Test Summary: ${testsPassed} passed, ${testsFailed} failed ---`);
  } catch (error) {
    console.error('[Rate Limit Test Error]', error);
    testsFailed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runRateLimitTests();
