/**
 * Load Test — coupon & promotion validation and application.
 *
 * Simulates customers validating coupon codes and applying them to baskets.
 * Tests the coupon validation endpoint and basket-level coupon operations.
 *
 * Run: k6 run tests/performance/load-coupon.js
 *
 * Requires: seeded database with coupon codes (yarn db:seed)
 *           COUPON_CODES env var (comma-separated) to override test codes
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { BASE_URL, checkResponse } from './config.js';

const couponErrors = new Rate('coupon_errors');
const couponsValidated = new Counter('coupons_validated');
const couponsApplied = new Counter('coupons_applied');

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
    coupon_errors: ['rate<0.10'],
  },
};

const jsonHeaders = { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } };

// Default test coupon codes — override with COUPON_CODES=CODE1,CODE2
const DEFAULT_COUPON_CODES = ['SAVE10', 'WELCOME15', 'FREESHIP', 'SUMMER20'];
const COUPON_CODES = (__ENV.COUPON_CODES || DEFAULT_COUPON_CODES.join(',')).split(',');

export default function () {
  const couponCode = COUPON_CODES[Math.floor(Math.random() * COUPON_CODES.length)];

  // ─── 1. Validate coupon (POST /customer/coupons/validate) ──────────
  // ValidateCouponBody: { code, orderValue, customerId?, items? }
  group('Validate Coupon', function () {
    const res = http.post(
      `${BASE_URL}/customer/coupons/validate`,
      JSON.stringify({
        code: couponCode,
        orderValue: 99.99,
        items: [
          { productId: `perf-test-product-${__VU}`, quantity: 1, price: 99.99 },
        ],
      }),
      jsonHeaders
    );

    // 200 (valid) or 400/404 (invalid/not found) are both acceptable
    if (res.status === 200) {
      couponsValidated.add(1);
      couponErrors.add(false);
    } else if (res.status === 400 || res.status === 404) {
      couponErrors.add(false);
    } else {
      couponErrors.add(true);
      console.error(`[validate-coupon] Unexpected status ${res.status}`);
    }
  });

  sleep(Math.random() * 1 + 0.5);

  // ─── 2. Validate coupon by code (GET /customer/coupons/validate/:code) ──
  group('Validate Coupon By Code', function () {
    const res = http.get(
      `${BASE_URL}/customer/coupons/validate/${encodeURIComponent(couponCode)}`,
      { headers: { Accept: 'application/json' } }
    );

    if (res.status === 200 || res.status === 400 || res.status === 404) {
      couponErrors.add(false);
    } else {
      couponErrors.add(true);
    }
  });

  sleep(Math.random() * 1 + 0.5);

  // ─── 3. Create basket, add item, apply coupon to basket ────────────
  // ApplyCouponBody (basket): { couponCode, basketId, orderTotal, items? }
  let basketId;
  group('Create Basket For Coupon', function () {
    const res = http.post(`${BASE_URL}/customer/basket`, JSON.stringify({}), jsonHeaders);
    if (res.status === 200) {
      basketId = res.json('data.basketId');
    }
    couponErrors.add(!checkResponse(res, 200, 'create-basket-for-coupon'));
  });

  if (!basketId) {
    couponErrors.add(true);
    sleep(1);
    return;
  }

  sleep(Math.random() * 0.5);

  // Add item so basket has a non-zero total
  group('Add Item For Coupon', function () {
    const res = http.post(
      `${BASE_URL}/customer/basket/${basketId}/items`,
      JSON.stringify({
        productId: `perf-test-product-${__VU}`,
        sku: `PERF-SKU-${__VU}`,
        name: 'Performance Test Product',
        quantity: 2,
        unitPrice: 49.99,
      }),
      jsonHeaders
    );
    couponErrors.add(!checkResponse(res, 200, 'add-item-for-coupon'));
  });

  sleep(Math.random() * 0.5);

  // Apply coupon to basket
  group('Apply Coupon To Basket', function () {
    const res = http.post(
      `${BASE_URL}/customer/basket/${basketId}/coupon`,
      JSON.stringify({ couponCode }),
      jsonHeaders
    );
    // 200 (applied) or 400 (invalid/expired) are both acceptable
    if (res.status === 200) {
      couponsApplied.add(1);
      couponErrors.add(false);
    } else if (res.status === 400 || res.status === 404) {
      couponErrors.add(false);
    } else {
      couponErrors.add(true);
      console.error(`[apply-coupon-basket] Unexpected status ${res.status}`);
    }
  });

  sleep(Math.random() * 1 + 0.5);

  // Remove coupon from basket
  group('Remove Coupon From Basket', function () {
    const res = http.del(
      `${BASE_URL}/customer/basket/${basketId}/coupon`,
      null,
      { headers: { Accept: 'application/json' } }
    );
    // 200 (removed) or 400 (no coupon applied) are both acceptable
    couponErrors.add(!(res.status === 200 || res.status === 400));
  });

  sleep(Math.random() * 1 + 0.5);

  // ─── 4. Apply coupon via coupon endpoint (POST /customer/coupons/apply) ──
  // ApplyCouponBody (coupon): { couponCode/code, basketId, orderTotal, items? }
  group('Apply Coupon Via Coupon Endpoint', function () {
    const res = http.post(
      `${BASE_URL}/customer/coupons/apply`,
      JSON.stringify({
        couponCode,
        basketId,
        orderTotal: 99.98,
        items: [
          { productId: `perf-test-product-${__VU}`, quantity: 2, price: 49.99 },
        ],
      }),
      jsonHeaders
    );

    if (res.status === 200) {
      couponsApplied.add(1);
      couponErrors.add(false);
    } else if (res.status === 400 || res.status === 404) {
      couponErrors.add(false);
    } else {
      couponErrors.add(true);
    }
  });

  sleep(1);
}
