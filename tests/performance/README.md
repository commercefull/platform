# Performance Testing with k6

Load, stress, and spike tests for the CommerceFull platform using [k6](https://k6.io).

## Prerequisites

### Install k6

**macOS (Homebrew):**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A36442D57D3C9381F6C85E878
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6
```

**Docker (no install):**
```bash
docker run --rm -i --network host grafana/k6 run - < tests/performance/smoke.js
```

### Start the server

```bash
yarn db          # Start PostgreSQL
yarn db:migrate  # Run migrations
yarn db:seed     # Seed test data (needed for auth/merchant tests)
yarn dev         # Start the dev server
```

## Test Suites

| File | Type | VUs | Duration | Description |
|---|---|---|---|---|
| `smoke.js` | Smoke | 1 | ~10s | Verify server is up and core endpoints respond |
| `load-product-browse.js` | Load | 20→50 | ~3.5m | Product browsing, search, categories |
| `load-basket.js` | Load | 10→30 | ~3m | Basket CRUD operations |
| `load-auth.js` | Load | 10→25 | ~3m | Customer login + authenticated endpoints |
| `load-checkout.js` | Load | 10→20 | ~3m | Checkout initiation + fulfillment options |
| `load-merchant.js` | Load | 5→15 | ~3m | Merchant dashboard API (products, orders, analytics) |
| `load-order-complete.js` | Load | 5→10 | ~4.5m | Full purchase flow: basket→checkout→shipping→payment→complete |
| `load-coupon.js` | Load | 10→25 | ~3m | Coupon validation, basket coupon apply/remove |
| `load-storefront.js` | Load | 15→40 | ~5m | Server-rendered EJS pages (home, PLP, PDP, search, content) |
| `stress.js` | Stress | 50→400 | ~12m | Progressive load to find breaking point |
| `spike.js` | Spike | 10→300 | ~3.5m | Sudden traffic burst (flash sale simulation) |

## Running Tests

### Via npm scripts

```bash
yarn perf:smoke           # Quick smoke test
yarn perf:load            # Run all load tests sequentially
yarn perf:load:browse     # Product browsing load test
yarn perf:load:basket     # Basket operations load test
yarn perf:load:auth       # Auth flow load test
yarn perf:load:checkout   # Checkout flow load test
yarn perf:load:merchant   # Merchant API load test
yarn perf:load:order      # Full order completion flow
yarn perf:load:coupon     # Coupon validation & application
yarn perf:load:storefront # Storefront EJS page rendering
yarn perf:stress          # Stress test (WARNING: heavy load)
yarn perf:spike           # Spike test
```

### Direct k6 commands

```bash
# Smoke test
k6 run tests/performance/smoke.js

# Load test with custom VUs and duration
k6 run --vus 100 --duration 5m tests/performance/load-product-browse.js

# Stress test with output to JSON
k6 run --out json=results.json tests/performance/stress.js

# Run against a different server
k6 run -e BASE_URL=http://staging.example.com tests/performance/smoke.js

# Auth tests with custom credentials
k6 run -e TEST_EMAIL=test@example.com -e TEST_PASSWORD=mypassword tests/performance/load-auth.js

# Merchant tests
k6 run -e TEST_MERCHANT_EMAIL=merchant@example.com -e TEST_MERCHANT_PASSWORD=password123 tests/performance/load-merchant.js
```

### Via Docker (no k6 install)

```bash
docker run --rm -i --network host grafana/k6 run - < tests/performance/smoke.js
```

## Configuration

Environment variables (all optional, have sensible defaults):

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | Target server URL |
| `TEST_EMAIL` | `user@example.com` | Customer test email |
| `TEST_PASSWORD` | `password123` | Customer test password |
| `TEST_MERCHANT_EMAIL` | `merchant@example.com` | Merchant test email |
| `TEST_MERCHANT_PASSWORD` | `password123` | Merchant test password |

## Interpreting Results

k6 outputs several key metrics:

- **`http_req_failed`** — Percentage of failed requests (non-2xx responses)
- **`http_req_duration`** — Response time percentiles (p(95), p(99))
- **`vus`** — Active virtual users
- **`iterations`** — Total iterations completed
- **`checks`** — Pass/fail rate of assertion checks

### Thresholds

Each test has built-in thresholds. If any threshold is breached, k6 exits with a non-zero code (useful for CI):

- Load tests: <5% error rate, p(95) < 500ms
- Stress test: <20% error rate, p(95) < 2000ms
- Spike test: <30% error rate, p(95) < 3000ms

### Output to external services

k6 can stream results to Grafana, InfluxDB, or JSON files:

```bash
# JSON output
k6 run --out json=results.json tests/performance/load-product-browse.js

# InfluxDB (for Grafana dashboards)
k6 run --out influxdb=http://localhost:8086/k6 tests/performance/stress.js
```

## Test Flow Diagrams

### Product Browsing Flow
```
GET /customer/products → GET /customer/products/search → GET /customer/products/featured → GET /customer/categories → GET /customer/products/search/suggestions
```

### Basket Flow
```
POST /customer/basket → GET /customer/basket/:id → GET /customer/basket/:id/summary → POST /customer/basket/:id/items → GET /customer/basket/:id → DELETE /customer/basket/:id
```

### Checkout Flow
```
GET /customer/checkout/payment-methods → GET /customer/checkout/pickup-locations → POST /customer/checkout → GET /customer/checkout/:id/fulfillment-options → GET /customer/checkout/:id/shipping-methods → GET /customer/checkout/:id
```

### Auth Flow
```
POST /customer/identity/token → GET /customer/basket/me → GET /customer/order → POST /customer/identity/refresh
```

### Merchant Flow
```
POST /business/auth/login → GET /business/products → GET /business/orders → GET /business/customers → GET /business/analytics/sales/dashboard
```

### Order Completion Flow
```
POST /customer/basket → POST /customer/basket/:id/items → POST /customer/checkout →
PUT /customer/checkout/:id/fulfillment-method → PUT /customer/checkout/:id/shipping-address →
GET /customer/checkout/:id/shipping-methods → PUT /customer/checkout/:id/shipping-method →
GET /customer/checkout/payment-methods → PUT /customer/checkout/:id/payment-method →
POST /customer/checkout/:id/payment-intent → POST /customer/checkout/:id/complete
```

### Coupon Flow
```
POST /customer/coupons/validate → GET /customer/coupons/validate/:code →
POST /customer/basket → POST /customer/basket/:id/items →
POST /customer/basket/:id/coupon → DELETE /customer/basket/:id/coupon →
POST /customer/coupons/apply
```

### Storefront Page Rendering Flow
```
GET / → GET /products → GET /search?q=… → GET /pages/about-us → GET /pages/:slug → GET /products/:categorySlug/:productId → GET /products/category/:categorySlug
```
