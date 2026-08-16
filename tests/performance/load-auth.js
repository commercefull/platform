/**
 * Load Test — customer authentication flow.
 *
 * Simulates customers logging in and accessing authenticated endpoints.
 * Uses seeded test credentials.
 *
 * Run: k6 run tests/performance/load-auth.js
 *
 * Requires: seeded database with test users (yarn db:seed)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { BASE_URL, checkResponse } from './config.js';

const authErrors = new Rate('auth_errors');
const loginsSuccessful = new Counter('logins_successful');

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '20s', target: 25 },
    { duration: '1m', target: 25 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    auth_errors: ['rate<0.05'],
  },
};

const TEST_EMAIL = __ENV.TEST_EMAIL || 'user@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'password123';

export default function () {
  let token;
  let refreshToken;

  // --- Login ---
  // Use /identity/token (issueTokenPair) instead of /identity/login so we also
  // get a refreshToken back, needed to exercise the refresh flow below.
  group('Customer Login', function () {
    const res = http.post(
      `${BASE_URL}/customer/identity/token`,
      JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    );

    authErrors.add(!checkResponse(res, 200, 'login'));

    if (res.status === 200) {
      const body = res.json();
      token = body.accessToken;
      refreshToken = body.refreshToken;
      if (token) loginsSuccessful.add(1);
    }
  });

  if (!token) {
    console.error('Login failed, skipping authenticated requests');
    return;
  }

  sleep(Math.random() * 2 + 1);

  // Authenticated requests must send Accept: application/json so the
  // isCustomerLoggedIn middleware takes the JWT path instead of the
  // session-redirect path (see libs/auth.ts isJsonRequest()).
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  };

  // --- Access authenticated endpoint: get my basket ---
  group('Auth: Get My Basket', function () {
    const res = http.get(`${BASE_URL}/customer/basket/me`, authHeaders);
    authErrors.add(!checkResponse(res, 200, 'my-basket'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- Access authenticated endpoint: get orders ---
  group('Auth: Get Orders', function () {
    const res = http.get(`${BASE_URL}/customer/order`, authHeaders);
    authErrors.add(!checkResponse(res, 200, 'orders'));
  });

  sleep(Math.random() * 2 + 1);

  // --- Refresh token ---
  group('Auth: Refresh Token', function () {
    if (!refreshToken) {
      authErrors.add(true);
      return;
    }
    const res = http.post(
      `${BASE_URL}/customer/identity/refresh`,
      JSON.stringify({ refreshToken }),
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    );
    // 200 (renewed) or 401 (revoked/expired) are both acceptable outcomes
    authErrors.add(!(res.status === 200 || res.status === 401));
  });

  sleep(1);
}
