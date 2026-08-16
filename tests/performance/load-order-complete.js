/**
 * Load Test — full order completion flow.
 *
 * Simulates the complete purchase journey:
 *   create basket → add item → initiate checkout → set fulfillment →
 *   set shipping address → get shipping methods → set shipping method →
 *   set payment method → create payment intent → complete checkout
 *
 * This is the heaviest write-path test. It creates real baskets, checkout
 * sessions, and (if the DB is seeded with products) real orders.
 *
 * Run: k6 run tests/performance/load-order-complete.js
 *
 * Requires: seeded database (yarn db:seed) with products, shipping methods,
 *           and payment methods configured.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { BASE_URL, checkResponse } from './config.js';

const flowErrors = new Rate('order_flow_errors');
const ordersCompleted = new Counter('orders_completed');
const flowDuration = new Trend('order_flow_total_duration', true);

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '2m', target: 5 },
    { duration: '20s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<1000', 'p(99)<3000'],
    order_flow_errors: ['rate<0.15'],
  },
};

const jsonHeaders = { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } };

const SHIPPING_ADDRESS = {
  firstName: 'Perf',
  lastName: 'Test',
  addressLine1: '123 Test St',
  city: 'Test City',
  postalCode: '12345',
  country: 'US',
  region: 'CA',
  phone: '555-0100',
};

export default function () {
  const flowStart = Date.now();
  let basketId;
  let checkoutId;

  // ─── 1. Create basket ──────────────────────────────────────────────
  group('Order Flow: Create Basket', function () {
    const res = http.post(`${BASE_URL}/customer/basket`, JSON.stringify({}), jsonHeaders);
    flowErrors.add(!checkResponse(res, 200, 'create-basket'));
    if (res.status === 200) {
      basketId = res.json('data.basketId');
    }
  });

  if (!basketId) {
    flowErrors.add(true);
    return;
  }

  sleep(Math.random() * 0.5);

  // ─── 2. Add item to basket ─────────────────────────────────────────
  group('Order Flow: Add Item', function () {
    const res = http.post(
      `${BASE_URL}/customer/basket/${basketId}/items`,
      JSON.stringify({
        productId: `perf-test-product-${__VU}`,
        sku: `PERF-SKU-${__VU}`,
        name: 'Performance Test Product',
        quantity: 1,
        unitPrice: 29.99,
      }),
      jsonHeaders
    );
    flowErrors.add(!checkResponse(res, 200, 'add-item'));
  });

  sleep(Math.random() * 0.5);

  // ─── 3. Initiate checkout ──────────────────────────────────────────
  group('Order Flow: Initiate Checkout', function () {
    const res = http.post(
      `${BASE_URL}/customer/checkout`,
      JSON.stringify({ basketId }),
      jsonHeaders
    );
    flowErrors.add(!checkResponse(res, 200, 'initiate-checkout'));
    if (res.status === 200) {
      checkoutId = res.json('data.checkoutId');
    }
  });

  if (!checkoutId) {
    flowErrors.add(true);
    return;
  }

  sleep(Math.random() * 0.5);

  // ─── 4. Set fulfillment method (shipping) ──────────────────────────
  group('Order Flow: Set Fulfillment', function () {
    const res = http.put(
      `${BASE_URL}/customer/checkout/${checkoutId}/fulfillment-method`,
      JSON.stringify({ fulfillmentType: 'shipping' }),
      jsonHeaders
    );
    flowErrors.add(!checkResponse(res, 200, 'set-fulfillment'));
  });

  sleep(Math.random() * 0.5);

  // ─── 5. Set shipping address ───────────────────────────────────────
  group('Order Flow: Set Shipping Address', function () {
    const res = http.put(
      `${BASE_URL}/customer/checkout/${checkoutId}/shipping-address`,
      JSON.stringify(SHIPPING_ADDRESS),
      jsonHeaders
    );
    flowErrors.add(!checkResponse(res, 200, 'set-shipping-address'));
  });

  sleep(Math.random() * 0.5);

  // ─── 6. Get shipping methods (requires shipping address) ──────────
  let shippingMethodId;
  group('Order Flow: Get Shipping Methods', function () {
    const res = http.get(
      `${BASE_URL}/customer/checkout/${checkoutId}/shipping-methods`,
      { headers: { Accept: 'application/json' } }
    );
    flowErrors.add(!checkResponse(res, 200, 'get-shipping-methods'));
    if (res.status === 200) {
      const methods = res.json('data');
      if (Array.isArray(methods) && methods.length > 0) {
        shippingMethodId = methods[0].id || methods[0].shippingMethodId;
      }
    }
  });

  sleep(Math.random() * 0.5);

  // ─── 7. Set shipping method ────────────────────────────────────────
  if (shippingMethodId) {
    group('Order Flow: Set Shipping Method', function () {
      const res = http.put(
        `${BASE_URL}/customer/checkout/${checkoutId}/shipping-method`,
        JSON.stringify({ shippingMethodId }),
        jsonHeaders
      );
      flowErrors.add(!checkResponse(res, 200, 'set-shipping-method'));
    });

    sleep(Math.random() * 0.5);
  }

  // ─── 8. Get payment methods ────────────────────────────────────────
  let paymentMethodId;
  group('Order Flow: Get Payment Methods', function () {
    const res = http.get(
      `${BASE_URL}/customer/checkout/payment-methods`,
      { headers: { Accept: 'application/json' } }
    );
    flowErrors.add(!checkResponse(res, 200, 'get-payment-methods'));
    if (res.status === 200) {
      const methods = res.json('data');
      if (Array.isArray(methods) && methods.length > 0) {
        paymentMethodId = methods[0].paymentMethodId || methods[0].id;
      }
    }
  });

  sleep(Math.random() * 0.5);

  // ─── 9. Set payment method ─────────────────────────────────────────
  if (paymentMethodId) {
    group('Order Flow: Set Payment Method', function () {
      const res = http.put(
        `${BASE_URL}/customer/checkout/${checkoutId}/payment-method`,
        JSON.stringify({ paymentMethodId }),
        jsonHeaders
      );
      flowErrors.add(!checkResponse(res, 200, 'set-payment-method'));
    });

    sleep(Math.random() * 0.5);

    // ─── 10. Create payment intent ───────────────────────────────────
    group('Order Flow: Create Payment Intent', function () {
      const res = http.post(
        `${BASE_URL}/customer/checkout/${checkoutId}/payment-intent`,
        JSON.stringify({}),
        jsonHeaders
      );
      // 200 (intent created) or 400 (invalid state) are acceptable
      flowErrors.add(!(res.status === 200 || res.status === 400));
    });

    sleep(Math.random() * 0.5);

    // ─── 11. Complete checkout ───────────────────────────────────────
    group('Order Flow: Complete Checkout', function () {
      const res = http.post(
        `${BASE_URL}/customer/checkout/${checkoutId}/complete`,
        JSON.stringify({}),
        jsonHeaders
      );
      // 200 (order created) or 400 (missing prerequisites) are acceptable
      if (res.status === 200) {
        ordersCompleted.add(1);
        flowErrors.add(false);
      } else if (res.status === 400) {
        flowErrors.add(false);
      } else {
        flowErrors.add(true);
        console.error(`[complete-checkout] Unexpected status ${res.status}`);
      }
    });
  } else {
    // No payment methods configured — still record the flow up to this point
    flowErrors.add(true);
  }

  flowDuration.add(Date.now() - flowStart);
  sleep(1);
}
