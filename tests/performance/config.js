/**
 * Shared configuration and helpers for k6 performance tests.
 *
 * Import via: import { BASE_URL, checkResponse, thresholds } from './config.js'
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const thresholds = {
  http_errors: ['rate<0.01'],
  http_duration: ['p(95)<500', 'p(99)<1000'],
  http_duration_critical: ['p(95)<200'],
};

export function checkResponse(res, expectedStatus, tag) {
  const passed = res.status === expectedStatus;
  if (!passed) {
    console.error(`[${tag}] Expected ${expectedStatus}, got ${res.status}: ${res.body?.substring(0, 200)}`);
  }
  return passed;
}
