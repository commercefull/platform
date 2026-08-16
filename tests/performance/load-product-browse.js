/**
 * Load Test — product browsing flow.
 *
 * Simulates users browsing products, searching, and viewing details.
 * Targets the most common storefront traffic pattern.
 *
 * Run: k6 run tests/performance/load-product-browse.js
 * With custom VUs/duration: k6 run --vus 50 --duration 2m tests/performance/load-product-browse.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';
import { BASE_URL, checkResponse } from './config.js';

const browseErrors = new Rate('browse_errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    browse_errors: ['rate<0.05'],
  },
};

export default function () {
  // --- Browse product listing ---
  group('Product Listing', function () {
    const res = http.get(`${BASE_URL}/customer/products?page=1&limit=20`);
    browseErrors.add(!checkResponse(res, 200, 'product-listing'));

    check(res, {
      'listing has results': () => {
        const body = res.json();
        return body && (body.data || body.products || body.items);
      },
    });
  });

  sleep(Math.random() * 2 + 1);

  // --- Search products ---
  group('Product Search', function () {
    const queries = ['shirt', 'shoes', 'electronics', 'home', 'gift'];
    const query = queries[Math.floor(Math.random() * queries.length)];
    const res = http.get(`${BASE_URL}/customer/products/search?q=${query}`);
    browseErrors.add(!checkResponse(res, 200, 'product-search'));
  });

  sleep(Math.random() * 2 + 1);

  // --- View featured products ---
  group('Featured Products', function () {
    const res = http.get(`${BASE_URL}/customer/products/featured`);
    browseErrors.add(!checkResponse(res, 200, 'featured'));
  });

  sleep(Math.random() * 2 + 1);

  // --- Browse categories ---
  group('Categories', function () {
    const res = http.get(`${BASE_URL}/customer/categories`);
    browseErrors.add(!checkResponse(res, 200, 'categories'));
  });

  sleep(Math.random() * 2 + 1);

  // --- Search suggestions (autocomplete) ---
  group('Search Suggestions', function () {
    const res = http.get(`${BASE_URL}/customer/products/search/suggestions?q=sh`);
    browseErrors.add(!checkResponse(res, 200, 'suggestions'));
  });

  sleep(Math.random() * 2 + 1);
}
