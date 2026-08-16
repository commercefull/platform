/**
 * Load Test — merchant/business API endpoints.
 *
 * Simulates merchant dashboard users listing products, orders, and customers.
 * Merchant API auth is JWT Bearer, not session cookies (see
 * modules/identity/interface/controllers/identityBusinessController.ts loginMerchant
 * and libs/auth.ts isMerchantLoggedIn).
 *
 * Run: k6 run tests/performance/load-merchant.js
 *
 * Requires: seeded database with test merchant (yarn db:seed)
 *           TEST_MERCHANT_EMAIL and TEST_MERCHANT_PASSWORD env vars
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { BASE_URL, checkResponse } from './config.js';

const merchantErrors = new Rate('merchant_errors');
const loginsSuccessful = new Counter('merchant_logins_successful');

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '20s', target: 15 },
    { duration: '1m', target: 15 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<600', 'p(99)<1500'],
    merchant_errors: ['rate<0.05'],
  },
};

const TEST_EMAIL = __ENV.TEST_MERCHANT_EMAIL || 'merchant@example.com';
const TEST_PASSWORD = __ENV.TEST_MERCHANT_PASSWORD || 'password123';

export default function () {
  let token;

  // --- Merchant login (JWT) ---
  // Mounted under /business (identityBusinessRouter), returns { accessToken }
  group('Merchant Login', function () {
    const res = http.post(
      `${BASE_URL}/business/auth/login`,
      JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
    );

    if (res.status === 200) {
      token = res.json('accessToken');
      if (token) loginsSuccessful.add(1);
      merchantErrors.add(false);
    } else {
      merchantErrors.add(true);
      console.error(`[merchant-login] Status ${res.status}`);
    }
  });

  if (!token) {
    sleep(2);
    return;
  }

  // Business endpoints require Accept: application/json to hit the JWT auth
  // path in isMerchantLoggedIn (otherwise it redirects like a browser session).
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  };

  sleep(Math.random() * 2 + 1);

  // --- List products (business API) ---
  group('Merchant: List Products', function () {
    const res = http.get(`${BASE_URL}/business/products?page=1&limit=20`, params);
    merchantErrors.add(!checkResponse(res, 200, 'merchant-products'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- List orders ---
  group('Merchant: List Orders', function () {
    const res = http.get(`${BASE_URL}/business/orders?page=1&limit=20`, params);
    merchantErrors.add(!checkResponse(res, 200, 'merchant-orders'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- List customers ---
  group('Merchant: List Customers', function () {
    const res = http.get(`${BASE_URL}/business/customers?page=1&limit=20`, params);
    merchantErrors.add(!checkResponse(res, 200, 'merchant-customers'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- Analytics dashboard ---
  group('Merchant: Sales Dashboard', function () {
    const res = http.get(`${BASE_URL}/business/analytics/sales/dashboard`, params);
    merchantErrors.add(!checkResponse(res, 200, 'merchant-dashboard'));
  });

  sleep(Math.random() * 2 + 1);
}
