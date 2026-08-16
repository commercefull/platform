/**
 * Stress Test — progressively increase load until the server breaks.
 *
 * Ramps up to high VU counts to find the breaking point.
 * Use to identify max throughput and latency degradation patterns.
 *
 * Run: k6 run tests/performance/stress.js
 *
 * WARNING: This will generate heavy load. Run only against local/dev instances.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, checkResponse } from './config.js';

const stressErrors = new Rate('stress_errors');
const responseTime = new Trend('stress_response_time', true);

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 400 },
    { duration: '2m', target: 400 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.20'],
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    stress_errors: ['rate<0.20'],
  },
};

export default function () {
  // Mix of read endpoints to simulate realistic traffic distribution

  group('Stress: Product List', function () {
    const res = http.get(`${BASE_URL}/customer/products?page=${Math.floor(Math.random() * 10) + 1}&limit=20`);
    responseTime.add(res.timings.duration);
    stressErrors.add(!checkResponse(res, 200, 'stress-products'));
  });

  sleep(0.5);

  group('Stress: Product Search', function () {
    const queries = ['shirt', 'shoes', 'bag', 'watch', 'phone', 'book', 'lamp'];
    const q = queries[Math.floor(Math.random() * queries.length)];
    const res = http.get(`${BASE_URL}/customer/products/search?q=${q}`);
    responseTime.add(res.timings.duration);
    stressErrors.add(!checkResponse(res, 200, 'stress-search'));
  });

  sleep(0.5);

  group('Stress: Health Check', function () {
    const res = http.get(`${BASE_URL}/health`);
    responseTime.add(res.timings.duration);
    stressErrors.add(!checkResponse(res, 200, 'stress-health'));
  });

  sleep(0.5);

  group('Stress: Categories', function () {
    const res = http.get(`${BASE_URL}/customer/categories`);
    responseTime.add(res.timings.duration);
    stressErrors.add(!checkResponse(res, 200, 'stress-categories'));
  });

  sleep(0.5);

  group('Stress: Featured Products', function () {
    const res = http.get(`${BASE_URL}/customer/products/featured`);
    responseTime.add(res.timings.duration);
    stressErrors.add(!checkResponse(res, 200, 'stress-featured'));
  });

  sleep(0.5);
}
