/**
 * Load Test — checkout flow (initiation + payment methods).
 *
 * Simulates users initiating checkout sessions and browsing fulfillment options.
 * Does not complete actual payments (would require Stripe test tokens).
 *
 * Run: k6 run tests/performance/load-checkout.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { BASE_URL, checkResponse, fetchTestProduct, loadStages } from './config.js';

const checkoutErrors = new Rate('checkout_errors');
const checkoutsInitiated = new Counter('checkouts_initiated');

export function setup() {
  return { product: fetchTestProduct() };
}

export const options = {
  stages: loadStages(10, 20),
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    checkout_errors: ['rate<0.10'],
  },
};

export default function (data) {
  const product = data.product;
  let checkoutId;
  let basketId;

  const jsonHeaders = { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } };

  // --- Get payment methods (pre-checkout) ---
  group('Get Payment Methods', function () {
    const res = http.get(`${BASE_URL}/customer/checkout/payment-methods`, { headers: { Accept: 'application/json' } });
    checkoutErrors.add(!checkResponse(res, 200, 'payment-methods'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- Get pickup locations ---
  group('Get Pickup Locations', function () {
    const res = http.get(`${BASE_URL}/customer/checkout/pickup-locations`, { headers: { Accept: 'application/json' } });
    checkoutErrors.add(!checkResponse(res, 200, 'pickup-locations'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- Create a real basket with an item so checkout can actually initiate ---
  // POST /customer/checkout requires an existing, non-empty basketId (InitiateCheckoutBody).
  // POST /customer/basket returns 201 Created.
  group('Setup Basket For Checkout', function () {
    const basketRes = http.post(`${BASE_URL}/customer/basket`, JSON.stringify({}), jsonHeaders);
    if (basketRes.status === 201) {
      basketId = basketRes.json('data.basketId');
    }
    if (basketId && product) {
      http.post(
        `${BASE_URL}/customer/basket/${basketId}/items`,
        JSON.stringify({
          productId: product.productId,
          sku: product.sku,
          name: product.name,
          quantity: 1,
          unitPrice: product.unitPrice,
        }),
        jsonHeaders,
      );
    }
  });

  if (!basketId) {
    checkoutErrors.add(true);
    sleep(1);
    return;
  }

  sleep(Math.random() * 1 + 0.5);

  // --- Initiate checkout ---
  // Response shape: { success: true, data: { checkoutId, ... } }
  group('Initiate Checkout', function () {
    const res = http.post(
      `${BASE_URL}/customer/checkout`,
      JSON.stringify({
        basketId: basketId,
      }),
      jsonHeaders,
    );

    if (res.status === 201) {
      checkoutId = res.json('data.checkoutId');
      if (checkoutId) checkoutsInitiated.add(1);
      checkoutErrors.add(false);
    } else if (res.status === 400) {
      // Basket may still fail domain validation (e.g. product not found) — acceptable for perf timing
      checkoutErrors.add(false);
    } else {
      checkoutErrors.add(true);
      console.error(`[initiate-checkout] Unexpected status ${res.status}`);
    }
  });

  if (!checkoutId) {
    sleep(1);
    return;
  }

  sleep(Math.random() * 2 + 1);

  // --- Get fulfillment options ---
  group('Get Fulfillment Options', function () {
    const res = http.get(`${BASE_URL}/customer/checkout/${checkoutId}/fulfillment-options`, { headers: { Accept: 'application/json' } });
    checkoutErrors.add(!checkResponse(res, 200, 'fulfillment-options'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- Set shipping address (required before shipping-methods) ---
  group('Set Shipping Address', function () {
    const res = http.put(
      `${BASE_URL}/customer/checkout/${checkoutId}/shipping-address`,
      JSON.stringify({
        firstName: 'Perf',
        lastName: 'Test',
        addressLine1: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        country: 'US',
        region: 'CA',
        phone: '555-0100',
      }),
      jsonHeaders,
    );
    checkoutErrors.add(!checkResponse(res, 200, 'shipping-address'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- Get shipping methods ---
  group('Get Shipping Methods', function () {
    const res = http.get(`${BASE_URL}/customer/checkout/${checkoutId}/shipping-methods`, { headers: { Accept: 'application/json' } });
    checkoutErrors.add(!checkResponse(res, 200, 'shipping-methods'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- Get checkout session ---
  group('Get Checkout Session', function () {
    const res = http.get(`${BASE_URL}/customer/checkout/${checkoutId}`, { headers: { Accept: 'application/json' } });
    checkoutErrors.add(!checkResponse(res, 200, 'get-checkout'));
  });

  sleep(1);
}
