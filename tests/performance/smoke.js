/**
 * Smoke Test — verify the server is up and core endpoints respond.
 *
 * Run: k6 run tests/performance/smoke.js
 *
 * Expected: <30 requests, all pass in <2s. Use before load tests.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, checkResponse } from './config.js';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  // Health check
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    'health returns 200': () => checkResponse(health, 200, 'health'),
    'health returns ok status': () => health.json('status') === 'ok',
  });

  // Product listing (public)
  const products = http.get(`${BASE_URL}/customer/products`);
  check(products, {
    'products returns 200': () => checkResponse(products, 200, 'products'),
  });

  // Featured products
  const featured = http.get(`${BASE_URL}/customer/products/featured`);
  check(featured, {
    'featured products returns 200': () => checkResponse(featured, 200, 'featured'),
  });

  // Product search
  const search = http.get(`${BASE_URL}/customer/products/search?q=shirt`);
  check(search, {
    'product search returns 200': () => checkResponse(search, 200, 'search'),
  });

  // Payment methods (public)
  const paymentMethods = http.get(`${BASE_URL}/customer/checkout/payment-methods`);
  check(paymentMethods, {
    'payment methods returns 200': () => checkResponse(paymentMethods, 200, 'payment-methods'),
  });

  // Categories
  const categories = http.get(`${BASE_URL}/customer/categories`);
  check(categories, {
    'categories returns 200': () => checkResponse(categories, 200, 'categories'),
  });

  sleep(1);
}
