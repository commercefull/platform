/**
 * Load Test — shopping cart / basket flow.
 *
 * Simulates users creating baskets, adding items, and viewing summaries.
 * Tests the basket CRUD endpoints under load.
 *
 * Run: k6 run tests/performance/load-basket.js
 * With custom VUs/duration: k6 run --vus 30 --duration 2m tests/performance/load-basket.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';
import { BASE_URL, checkResponse, fetchTestProduct, loadStages } from './config.js';

const basketErrors = new Rate('basket_errors');
const basketsCreated = new Counter('baskets_created');

export function setup() {
  return { product: fetchTestProduct() };
}

export const options = {
  stages: loadStages(10, 30),
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    basket_errors: ['rate<0.05'],
  },
};

export default function (data) {
  const product = data.product;
  let basketId;

  // --- Create basket ---
  // Response shape: { success: true, data: { basketId, items, ... } }
  // The API returns 201 Created for a new basket.
  group('Create Basket', function () {
    const res = http.post(`${BASE_URL}/customer/basket`, JSON.stringify({}), {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    basketErrors.add(!checkResponse(res, 201, 'create-basket'));

    if (res.status === 201) {
      const body = res.json();
      basketId = body.data?.basketId;
      if (basketId) {
        basketsCreated.add(1);
      }
    }
  });

  if (!basketId) {
    console.error('No basket ID obtained, skipping rest of flow');
    return;
  }

  sleep(Math.random() * 2 + 1);

  // --- Get basket ---
  group('Get Basket', function () {
    const res = http.get(`${BASE_URL}/customer/basket/${basketId}`, { headers: { Accept: 'application/json' } });
    basketErrors.add(!checkResponse(res, 200, 'get-basket'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- Get basket summary ---
  group('Basket Summary', function () {
    const res = http.get(`${BASE_URL}/customer/basket/${basketId}/summary`, { headers: { Accept: 'application/json' } });
    basketErrors.add(!checkResponse(res, 200, 'basket-summary'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- Add item to basket ---
  // AddItemBody requires: productId, sku, name, quantity, unitPrice (see BasketController.ts)
  group('Add Item', function () {
    const quantity = Math.floor(Math.random() * 3) + 1;
    if (!product) {
      console.error('No purchasable product found — seed the database before running load tests');
      basketErrors.add(true);
      return;
    }
    const res = http.post(
      `${BASE_URL}/customer/basket/${basketId}/items`,
      JSON.stringify({
        productId: product.productId,
        sku: product.sku,
        name: product.name,
        quantity: quantity,
        unitPrice: product.unitPrice,
      }),
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } },
    );
    basketErrors.add(!checkResponse(res, 201, 'add-item'));
  });

  sleep(Math.random() * 2 + 1);

  // --- Get basket after adding item ---
  group('Get Basket After Add', function () {
    const res = http.get(`${BASE_URL}/customer/basket/${basketId}`, { headers: { Accept: 'application/json' } });
    basketErrors.add(!checkResponse(res, 200, 'get-basket-after-add'));
  });

  sleep(Math.random() * 1 + 0.5);

  // --- Clean up: delete basket ---
  group('Delete Basket', function () {
    const res = http.del(`${BASE_URL}/customer/basket/${basketId}`, null, { headers: { Accept: 'application/json' } });
    basketErrors.add(!checkResponse(res, 200, 'delete-basket'));
  });

  sleep(1);
}
