/**
 * Shared configuration and helpers for k6 performance tests.
 *
 * Import via: import { BASE_URL, checkResponse, thresholds } from './config.js'
 */

import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const thresholds = {
  http_errors: ['rate<0.01'],
  http_duration: ['p(95)<500', 'p(99)<1000'],
  http_duration_critical: ['p(95)<200'],
};

export function loadStages(lowTarget, highTarget, rampDuration = '20s', steadyDuration = '1m') {
  const configuredTarget = Number(__ENV.TARGET_VUS || 0);
  const high = Number.isInteger(configuredTarget) && configuredTarget > 0 ? configuredTarget : highTarget;
  const low = configuredTarget > 0 ? Math.max(1, Math.ceil(configuredTarget / 2)) : lowTarget;
  const ramp = __ENV.RAMP_DURATION || rampDuration;
  const steady = __ENV.STEADY_DURATION || steadyDuration;
  return [
    { duration: ramp, target: low },
    { duration: steady, target: low },
    { duration: ramp, target: high },
    { duration: steady, target: high },
    { duration: ramp, target: 0 },
  ];
}

/**
 * k6 request params marking additional status codes as "expected" so
 * tolerated 4xx responses (e.g. invalid coupon) don't inflate http_req_failed.
 * Usage: http.post(url, body, { headers: {...}, ...expectStatuses(400, 404) })
 */
export function expectStatuses(...codes) {
  return { responseCallback: http.expectedStatuses({ min: 200, max: 399 }, ...codes) };
}

export function checkResponse(res, expectedStatus, tag) {
  const passed = res.status === expectedStatus;
  if (!passed) {
    console.error(`[${tag}] Expected ${expectedStatus}, got ${res.status}: ${res.body?.substring(0, 200)}`);
  }
  return passed;
}

/**
 * Fetch a real purchasable product for suites that add items to baskets.
 * Call from setup() — the API validates productId/price server-side, so fake
 * IDs return 400 and never exercise the real write path.
 *
 * Returns { productId, sku, name, unitPrice } or null when the catalog is empty.
 */
export function fetchTestProduct() {
  if (__ENV.TEST_PRODUCT_ID) {
    return {
      productId: __ENV.TEST_PRODUCT_ID,
      sku: __ENV.TEST_PRODUCT_SKU || 'TEST-SKU',
      name: 'Test Product',
      unitPrice: Number(__ENV.TEST_PRODUCT_PRICE || 19.99),
    };
  }
  const res = http.get(`${BASE_URL}/customer/products?limit=1`, { headers: { Accept: 'application/json' } });
  if (res.status !== 200) {
    return null;
  }
  const product = res.json('data.products.0');
  if (!product || !product.productId) {
    return null;
  }
  const priceCents = product.effectivePriceCents ?? product.basePriceCents ?? 0;
  return {
    productId: product.productId,
    sku: product.sku,
    name: product.name,
    unitPrice: priceCents / 100,
  };
}
