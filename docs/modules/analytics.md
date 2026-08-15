# Analytics Feature

## Overview

The Analytics feature provides business intelligence and reporting capabilities, tracking events across the platform and aggregating them into actionable insights. It includes real-time metrics, historical analytics, custom dashboards, and event tracking.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-ANA-001 | Get Sales Dashboard | Merchant/Admin | Retrieve aggregated sales summary, daily breakdown, and real-time metrics for a given period |
| UC-ANA-002 | Get Daily Sales Data | Merchant/Admin | Retrieve paginated daily sales metrics with optional channel filtering |
| UC-ANA-003 | Get Product Performance | Merchant/Admin | Retrieve product-level analytics including views, conversions, revenue, and quantity sold |
| UC-ANA-004 | Get Top Products | Merchant/Admin | Retrieve best-performing products sorted by revenue, purchases, or views |
| UC-ANA-005 | Get Search Analytics | Merchant/Admin | Retrieve search query performance data including click-through and conversion rates |
| UC-ANA-006 | Get Zero Result Searches | Merchant/Admin | Identify searches that returned no products to highlight catalog gaps |
| UC-ANA-007 | Get Customer Cohorts | Merchant/Admin | Analyze customer retention by acquisition month with revenue and LTV per cohort |
| UC-ANA-008 | Get Events | Merchant/Admin | Retrieve raw tracked events with optional filtering by type, category, or entity |
| UC-ANA-009 | Get Event Counts | Merchant/Admin | Retrieve event counts aggregated by hour or day for trend analysis |
| UC-ANA-010 | Get Snapshots | Merchant/Admin | Retrieve historical point-in-time business state snapshots (hourly/daily/weekly/monthly) |
| UC-ANA-011 | Get Latest Snapshot | Merchant/Admin | Retrieve the most recent business snapshot for a quick current-state overview |
| UC-ANA-012 | Get Real-time Metrics | Merchant/Admin | Retrieve live activity metrics (visitors, orders, revenue, cart activity) for the last N minutes |
| UC-ANA-013 | List Dashboards | Merchant/Admin | List all available custom and shared analytics dashboards |
| UC-ANA-014 | Get Dashboard | Merchant/Admin | Retrieve a specific dashboard configuration including layout, widgets, and filters |
| UC-ANA-015 | Create Dashboard | Merchant/Admin | Create a new custom analytics dashboard with widgets, layout, and sharing settings |
| UC-ANA-016 | Update Dashboard | Merchant/Admin | Update an existing dashboard's name, layout, widgets, filters, or sharing settings |
| UC-ANA-017 | Delete Dashboard | Merchant/Admin | Permanently delete a custom dashboard (system defaults cannot be deleted) |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-ANA-001 | GET | `/business/analytics/sales/dashboard` |
| UC-ANA-002 | GET | `/business/analytics/sales/daily` |
| UC-ANA-003 | GET | `/business/analytics/products` |
| UC-ANA-004 | GET | `/business/analytics/products/top` |
| UC-ANA-005 | GET | `/business/analytics/search` |
| UC-ANA-006 | GET | `/business/analytics/search/zero-results` |
| UC-ANA-007 | GET | `/business/analytics/customers/cohorts` |
| UC-ANA-008 | GET | `/business/analytics/events` |
| UC-ANA-009 | GET | `/business/analytics/events/counts` |
| UC-ANA-010 | GET | `/business/analytics/snapshots` |
| UC-ANA-011 | GET | `/business/analytics/snapshots/latest` |
| UC-ANA-012 | GET | `/business/analytics/realtime` |
| UC-ANA-013 | GET | `/business/analytics/dashboards` |
| UC-ANA-014 | GET | `/business/analytics/dashboards/:id` |
| UC-ANA-015 | POST | `/business/analytics/dashboards` |
| UC-ANA-016 | PUT | `/business/analytics/dashboards/:id` |
| UC-ANA-017 | DELETE | `/business/analytics/dashboards/:id` |

---

## Events Tracked

The analytics system listens to and tracks these events:

| Event Category   | Events                                       |
| ---------------- | -------------------------------------------- |
| **Order**        | created, completed, cancelled, refunded      |
| **Cart/Basket**  | created, item_added, item_removed, abandoned |
| **Checkout**     | started, completed                           |
| **Payment**      | success, failed                              |
| **Product**      | viewed, created                              |
| **Customer**     | created, updated                             |
| **Subscription** | created, cancelled                           |
| **Support**      | ticket_created, ticket_resolved              |
| **Review**       | created                                      |
| **Alert**        | stock_alert_created                          |

---

## Integration Test Coverage

| Use Case   | Test File                     | Status |
| ---------- | ----------------------------- | ------ |
| UC-ANA-001 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-002 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-003 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-004 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-005 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-006 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-007 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-008 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-009 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-010 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-011 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-012 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-013 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-014 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-015 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-016 | `analytics/analytics.test.ts` | ❌     |
| UC-ANA-017 | `analytics/analytics.test.ts` | ❌     |
