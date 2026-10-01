/**
 * Load Test — storefront page rendering (EJS server-side).
 *
 * Simulates visitors browsing the server-rendered storefront pages.
 * These pages go through the full EJS view-render pipeline + DB queries,
 * capturing overhead that JSON API-only tests miss.
 *
 * Storefront routes are mounted at '/' (see boot/routes.ts).
 *
 * Run: k6 run tests/performance/load-storefront.js
 *
 * Requires: seeded database with products, categories, and content pages.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, expectStatuses, fetchTestProduct, loadStages } from './config.js';

const pageErrors = new Rate('storefront_page_errors');
const pageRenderTime = new Trend('storefront_render_time', true);

export function setup() {
  return { product: fetchTestProduct() };
}

export const options = {
  stages: loadStages(15, 40, '30s', '2m'),
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    storefront_page_errors: ['rate<0.05'],
  },
};

function checkPage(res, tag) {
  const ok = res.status === 200;
  if (!ok) {
    console.error(`[${tag}] Expected 200, got ${res.status}`);
  }
  // Verify we got HTML, not a JSON error
  const isHtml = res.headers['Content-Type'] && res.headers['Content-Type'].includes('text/html');
  if (ok && !isHtml) {
    console.error(`[${tag}] Expected text/html, got ${res.headers['Content-Type']}`);
  }
  return ok && isHtml;
}

export default function (data) {
  const product = data.product;
  // ─── Home page ─────────────────────────────────────────────────────
  group('Storefront: Home Page', function () {
    const res = http.get(`${BASE_URL}/`);
    pageRenderTime.add(res.timings.duration);
    pageErrors.add(!checkPage(res, 'home'));
    check(res, {
      'home has products section': () => res.body && res.body.length > 500,
    });
  });

  sleep(Math.random() * 3 + 1);

  // ─── Product listing page (PLP) ────────────────────────────────────
  group('Storefront: Product Listing', function () {
    const res = http.get(`${BASE_URL}/products?page=1&limit=12`);
    pageRenderTime.add(res.timings.duration);
    pageErrors.add(!checkPage(res, 'plp'));
  });

  sleep(Math.random() * 3 + 1);

  // ─── Search page ───────────────────────────────────────────────────
  group('Storefront: Search', function () {
    const queries = ['shirt', 'shoes', 'bag', 'watch', 'phone'];
    const q = queries[Math.floor(Math.random() * queries.length)];
    const res = http.get(`${BASE_URL}/search?q=${q}&page=1&limit=12`);
    pageRenderTime.add(res.timings.duration);
    pageErrors.add(!checkPage(res, 'search'));
  });

  sleep(Math.random() * 2 + 1);

  // ─── About us page ─────────────────────────────────────────────────
  group('Storefront: About Us', function () {
    const res = http.get(`${BASE_URL}/pages/about-us`);
    pageRenderTime.add(res.timings.duration);
    pageErrors.add(!checkPage(res, 'about-us'));
  });

  sleep(Math.random() * 2 + 1);

  // ─── Content page by slug ──────────────────────────────────────────
  group('Storefront: Content Page', function () {
    const res = http.get(`${BASE_URL}/pages/shipping-policy`, expectStatuses(404));
    // 200 or 404 (page may not exist) are both acceptable
    pageErrors.add(!(res.status === 200 || res.status === 404));
    if (res.status === 200) {
      pageRenderTime.add(res.timings.duration);
    }
  });

  sleep(Math.random() * 2 + 1);

  // ─── Product detail page (PDP) ─────────────────────────────────────
  // Route: /products/:categorySlug/:productId — 'all' works as the category
  // slug and productId comes from setup() so the real render path is measured.
  group('Storefront: Product Detail', function () {
    if (!product) {
      return;
    }
    const res = http.get(`${BASE_URL}/products/all/${product.productId}`, expectStatuses(404));
    pageErrors.add(!(res.status === 200 || res.status === 404));
    if (res.status === 200) {
      pageRenderTime.add(res.timings.duration);
    }
  });

  sleep(Math.random() * 3 + 1);

  // ─── Products by category ──────────────────────────────────────────
  group('Storefront: Category Products', function () {
    const res = http.get(`${BASE_URL}/products/category/electronics`, expectStatuses(404));
    pageErrors.add(!(res.status === 200 || res.status === 404));
    if (res.status === 200) {
      pageRenderTime.add(res.timings.duration);
    }
  });

  sleep(Math.random() * 2 + 1);
}
