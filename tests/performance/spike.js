/**
 * Spike Test — sudden burst of traffic followed by normal load.
 *
 * Simulates a flash sale or viral traffic spike.
 * Tests if the server recovers after the spike subsides.
 *
 * Run: k6 run tests/performance/spike.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, checkResponse } from './config.js';

const spikeErrors = new Rate('spike_errors');
const spikeResponseTime = new Trend('spike_response_time', true);

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '30s', target: 10 },
    { duration: '10s', target: 300 },
    { duration: '1m', target: 300 },
    { duration: '10s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.30'],
    http_req_duration: ['p(95)<3000', 'p(99)<8000'],
    spike_errors: ['rate<0.30'],
  },
};

export default function () {
  group('Spike: Product Browse', function () {
    const res = http.get(`${BASE_URL}/customer/products?page=1&limit=20`);
    spikeResponseTime.add(res.timings.duration);
    spikeErrors.add(!checkResponse(res, 200, 'spike-browse'));
  });

  sleep(0.3);

  group('Spike: Health', function () {
    const res = http.get(`${BASE_URL}/health`);
    spikeResponseTime.add(res.timings.duration);
    spikeErrors.add(!checkResponse(res, 200, 'spike-health'));
  });

  sleep(0.3);
}
