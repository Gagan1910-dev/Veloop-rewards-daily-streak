import http from 'http';
import mongoose from 'mongoose';
import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Safe fallback
}

import app from '../app.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';

const PORT = 5055;
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

const runAuthTests = async () => {
  console.log('--- Starting Authentication Test Suite ---');
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
    // Check if Mongo is available or if we should test against test database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/veloop_test';
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      console.log('Connected to MongoDB for integration test.');
      // Clean test users
      await User.deleteMany({ email: /@testauth\.com$/ });
      await Wallet.deleteMany({});
    } catch (e) {
      console.warn(`[Mongo Notice] Local/Remote Mongo connection not active (${e.message}). Testing validators, middleware, token generation & signature verification.`);
    }

    server = app.listen(PORT);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const testUser = {
      name: 'Gagan Chandra',
      email: 'gagan@testauth.com',
      password: 'SecurePassword123!'
    };

    let authToken = '';

    // Test 1: Validation failure on registration (missing fields)
    const invalidRegRes = await makeRequest(
      {
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { email: 'bademail' }
    );
    assert(
      invalidRegRes.status === 400 && invalidRegRes.body.success === false,
      'Validation rejects invalid registration payload',
      JSON.stringify(invalidRegRes.body)
    );

    // Test 2: Protected endpoint without token
    const noTokenRes = await makeRequest({
      path: '/api/auth/me',
      method: 'GET'
    });
    assert(
      noTokenRes.status === 401 && noTokenRes.body.success === false,
      'Protected endpoint rejects request with no Authorization header',
      JSON.stringify(noTokenRes.body)
    );

    // Test 3: Protected endpoint with invalid/corrupted token
    const badTokenRes = await makeRequest({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.jwt.token.string' }
    });
    assert(
      badTokenRes.status === 401 && badTokenRes.body.success === false,
      'Protected endpoint rejects malformed/tampered JWT',
      JSON.stringify(badTokenRes.body)
    );

    // Test 4: If DB is connected, test live Registration, Duplicate Prevention, Login, and Auth/Me
    if (mongoose.connection.readyState === 1) {
      // 4a. Successful Registration
      const regRes = await makeRequest(
        {
          path: '/api/auth/register',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        testUser
      );
      assert(
        regRes.status === 201 &&
          regRes.body.success === true &&
          regRes.body.data.token &&
          regRes.body.data.wallet.gemsBalance === 0 &&
          regRes.body.data.wallet.vesBalance === 0,
        'Successful registration returns 201, JWT, and initializes clean zero-balance Wallet',
        JSON.stringify(regRes.body)
      );

      authToken = regRes.body.data ? regRes.body.data.token : '';

      // 4b. Duplicate Registration check
      const dupRes = await makeRequest(
        {
          path: '/api/auth/register',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        testUser
      );
      assert(
        dupRes.status === 409 && dupRes.body.success === false,
        'Duplicate registration rejected with 409 Conflict',
        JSON.stringify(dupRes.body)
      );

      // 4c. Successful Login
      const loginRes = await makeRequest(
        {
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        { email: testUser.email, password: testUser.password }
      );
      assert(
        loginRes.status === 200 &&
          loginRes.body.success === true &&
          loginRes.body.data.token &&
          !loginRes.body.data.user.password,
        'Successful login returns 200, JWT, and never leaks password hash',
        JSON.stringify(loginRes.body)
      );

      // 4d. Invalid Password
      const wrongPassRes = await makeRequest(
        {
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        { email: testUser.email, password: 'WrongPassword456!' }
      );
      assert(
        wrongPassRes.status === 401 && wrongPassRes.body.success === false,
        'Login with incorrect password returns 401 Unauthorized',
        JSON.stringify(wrongPassRes.body)
      );

      // 4e. Protected /api/auth/me with valid token
      const meRes = await makeRequest({
        path: '/api/auth/me',
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert(
        meRes.status === 200 &&
          meRes.body.success === true &&
          meRes.body.data.user.email === testUser.email &&
          meRes.body.data.wallet.gemsBalance === 0 &&
          meRes.body.data.wallet.vesBalance === 0,
        'Protected /api/auth/me verifies valid token and returns authentic user & zero-balance wallet',
        JSON.stringify(meRes.body)
      );
    }

    console.log(`\n--- Test Suite Summary: ${testsPassed} passed, ${testsFailed} failed ---`);
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (server) server.close();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
};

runAuthTests();
