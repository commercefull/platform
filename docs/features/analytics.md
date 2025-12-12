# Analytics Feature

## Overview

The Analytics feature provides business intelligence and reporting capabilities, tracking events across the platform and aggregating them into actionable insights. It includes real-time metrics, historical analytics, custom dashboards, and event tracking.

---

## Use Cases

### UC-ANA-001: Get Sales Dashboard
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request the sales dashboard  
**Then** the system returns sales summary, daily data, and real-time metrics

#### API Endpoint
```
GET /business/analytics/sales/dashboard
Query: startDate, endDate, merchantId
```

#### Business Rules
- Returns aggregated sales metrics for the period
- Includes summary (total revenue, orders, AOV)
- Includes daily breakdown
- Includes real-time metrics (last 60 minutes)

---

### UC-ANA-002: Get Daily Sales Data
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a date range  
**When** they request daily sales data  
**Then** the system returns paginated daily sales metrics

#### API Endpoint
```
GET /business/analytics/sales/daily
Query: startDate, endDate, channel, merchantId, limit, offset
```

#### Business Rules
- Data is aggregated by day
- Can filter by channel (web, mobile, etc.)
- Includes order count, revenue, conversion rates
- Supports pagination

---

### UC-ANA-003: Get Product Performance
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** optional filters  
**When** they request product performance data  
**Then** the system returns product-level analytics

#### API Endpoint
```
GET /business/analytics/products
Query: productId, startDate, endDate, limit, offset
```

#### Business Rules
- Tracks views, add-to-carts, purchases
- Calculates conversion rates
- Includes revenue and quantity sold
- Can filter by specific product

---

### UC-ANA-004: Get Top Products
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request top products  
**Then** the system returns best performing products by chosen metric

#### API Endpoint
```
GET /business/analytics/products/top
Query: startDate, endDate, metric (revenue|purchases|views), limit
```

#### Business Rules
- Can sort by revenue, purchase count, or views
- Returns aggregated data for period
- Default metric is revenue
- Default limit is 10 products

---

### UC-ANA-005: Get Search Analytics
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request search analytics  
**Then** the system returns search query performance data

#### API Endpoint
```
GET /business/analytics/search
Query: startDate, endDate, isZeroResult, query, limit, offset
```

#### Business Rules
- Shows what customers are searching for
- Includes search count, click-through rate
- Includes conversion rate from search
- Can filter for zero-result searches

---

### UC-ANA-006: Get Zero Result Searches
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request zero-result searches  
**Then** the system returns searches that returned no products

#### API Endpoint
```
GET /business/analytics/search/zero-results
Query: startDate, endDate, limit
```

#### Business Rules
- Identifies product gaps
- Helps improve search and catalog
- Sorted by frequency

---

### UC-ANA-007: Get Customer Cohorts
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request customer cohort data  
**Then** the system returns retention analysis by acquisition month

#### API Endpoint
```
GET /business/analytics/customers/cohorts
Query: startMonth, endMonth
```

#### Business Rules
- Groups customers by acquisition month
- Tracks retention over time
- Includes revenue per cohort
- Calculates customer lifetime value

---

### UC-ANA-008: Get Events
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** optional filters  
**When** they request tracked events  
**Then** the system returns raw event data

#### API Endpoint
```
GET /business/analytics/events
Query: eventType, eventCategory, customerId, orderId, productId, startDate, endDate, limit, offset
```

#### Business Rules
- Returns raw event tracking data
- Can filter by event type, category
- Can filter by entity (customer, order, product)
- Supports pagination

---

### UC-ANA-009: Get Event Counts
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a time range  
**When** they request event counts  
**Then** the system returns event counts grouped by period

#### API Endpoint
```
GET /business/analytics/events/counts
Query: startDate, endDate, groupBy (hour|day)
```

#### Business Rules
- Aggregates event counts by period
- Groups by hour or day
- Shows event distribution over time

---

### UC-ANA-010: Get Snapshots
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a snapshot type and date range  
**When** they request snapshots  
**Then** the system returns historical business state snapshots

#### API Endpoint
```
GET /business/analytics/snapshots
Query: snapshotType (hourly|daily|weekly|monthly), startDate, endDate, merchantId
```

#### Business Rules
- Shows point-in-time business metrics
- Includes order counts, revenue, customer counts
- Includes inventory and support metrics
- Useful for trend analysis

---

### UC-ANA-011: Get Latest Snapshot
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request the latest snapshot  
**Then** the system returns the most recent snapshot

#### API Endpoint
```
GET /business/analytics/snapshots/latest
Query: snapshotType (hourly|daily|weekly|monthly), merchantId
```

#### Business Rules
- Returns single most recent snapshot
- Quick overview of current state
- Includes all tracked metrics

---

### UC-ANA-012: Get Real-time Metrics
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request real-time metrics  
**Then** the system returns current activity metrics

#### API Endpoint
```
GET /business/analytics/realtime
Query: merchantId, minutes (default: 60)
```

#### Business Rules
- Returns metrics for last N minutes
- Includes active visitors
- Includes orders and revenue
- Includes cart activity

---

### UC-ANA-013: List Dashboards
**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request their dashboards  
**Then** the system returns all available dashboards

#### API Endpoint
```
GET /business/analytics/dashboards
```

#### Business Rules
- Returns custom and default dashboards
- Includes shared dashboards
- Sorted by default flag, then name

---

### UC-ANA-014: Get Dashboard
**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid dashboard ID  
**When** they request the dashboard  
**Then** the system returns the dashboard configuration

#### API Endpoint
```
GET /business/analytics/dashboards/:id
```

#### Business Rules
- Returns dashboard layout and widgets
- Includes filter configuration
- Returns 404 if not found

---

### UC-ANA-015: Create Dashboard
**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** an authenticated merchant  
**When** they create a new dashboard  
**Then** the system creates and returns the dashboard

#### API Endpoint
```
POST /business/analytics/dashboards
Body: { name, description?, layout?, widgets?, filters?, dateRange?, isDefault?, isShared? }
```

#### Business Rules
- Dashboard name is required
- Can configure widgets and layout
- Can set default date range
- Can share with other users

---

### UC-ANA-016: Update Dashboard
**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** an authenticated merchant  
**And** an existing dashboard  
**When** they update the dashboard  
**Then** the system saves the changes

#### API Endpoint
```
PUT /business/analytics/dashboards/:id
Body: { name?, description?, layout?, widgets?, filters?, dateRange?, isDefault?, isShared? }
```

#### Business Rules
- Can update any dashboard field
- Validates widget configurations
- Returns updated dashboard

---

### UC-ANA-017: Delete Dashboard
**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** an authenticated merchant  
**And** an existing dashboard  
**When** they delete the dashboard  
**Then** the system removes the dashboard

#### API Endpoint
```
DELETE /business/analytics/dashboards/:id
```

#### Business Rules
- Permanently deletes dashboard
- Cannot delete default system dashboards
- Returns success message

---

## Events Tracked

The analytics system listens to and tracks these events:

| Event Category | Events |
|----------------|--------|
| **Order** | created, completed, cancelled, refunded |
| **Cart/Basket** | created, item_added, item_removed, abandoned |
| **Checkout** | started, completed |
| **Payment** | success, failed |
| **Product** | viewed, created |
| **Customer** | created, updated |
| **Subscription** | created, cancelled |
| **Support** | ticket_created, ticket_resolved |
| **Review** | created |
| **Alert** | stock_alert_created |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-ANA-001 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-002 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-003 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-004 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-005 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-006 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-007 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-008 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-009 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-010 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-011 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-012 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-013 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-014 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-015 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-016 | `analytics/analytics.test.ts` | ❌ |
| UC-ANA-017 | `analytics/analytics.test.ts` | ❌ |
