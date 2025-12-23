# Analytics Feature Integration Tests

This directory contains integration tests for the Analytics feature.

## Test Structure

```
tests/integration/analytics/
├── README.md
├── reports/
│   └── reports.test.ts      # Analytics reporting endpoints
├── tracking/
│   └── (tracking tests)     # Event tracking tests (future)
└── analytics.test.ts        # Legacy combined tests
```

## Running Tests

### Run all Analytics tests

```bash
npm test -- --testPathPatterns="tests/integration/analytics"
```

### Run specific domain tests

```bash
# Reports
npm test -- --testPathPatterns="tests/integration/analytics/reports"
```

## Test Coverage

### Reports (`reports.test.ts`)

**Sales Analytics:**

- GET /analytics/sales/dashboard - Sales dashboard with summary
- GET /analytics/sales/daily - Daily sales data with filtering

**Product Analytics:**

- GET /analytics/products - Product performance data
- GET /analytics/products/top - Top performing products

**Search Analytics:**

- GET /analytics/search - Search analytics data
- GET /analytics/search/zero-results - Zero result searches

**Customer Analytics:**

- GET /analytics/customers/cohorts - Customer cohort analysis

**Event Tracking:**

- GET /analytics/events - Tracked events
- GET /analytics/events/counts - Event counts by period

## Prerequisites

- Server must be running (`yarn dev`)
- Database must be migrated and seeded
- Valid admin credentials in testConstants.ts
