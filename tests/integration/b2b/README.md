# B2B Feature Integration Tests

This directory contains integration tests for the B2B feature.

## Test Structure

```
tests/integration/b2b/
├── README.md
├── companies/
│   └── companies.test.ts    # Company CRUD and approval workflow
├── quotes/
│   └── quotes.test.ts       # Quote CRUD and item management
└── b2b.test.ts              # Legacy combined tests
```

## Running Tests

### Run all B2B tests

```bash
npm test -- --testPathPatterns="tests/integration/b2b"
```

### Run specific domain tests

```bash
# Companies
npm test -- --testPathPatterns="tests/integration/b2b/companies"

# Quotes
npm test -- --testPathPatterns="tests/integration/b2b/quotes"
```

## Test Coverage

### Companies (`companies.test.ts`)

- GET /b2b/companies - List companies with filtering and pagination
- POST /b2b/companies - Create new company
- GET /b2b/companies/:id - Get company by ID
- PUT /b2b/companies/:id - Update company
- POST /b2b/companies/:id/approve - Approve pending company
- POST /b2b/companies/:id/suspend - Suspend active company
- DELETE /b2b/companies/:id - Delete company

### Quotes (`quotes.test.ts`)

- GET /b2b/quotes - List quotes with filtering
- POST /b2b/quotes - Create new quote
- GET /b2b/quotes/:id - Get quote by ID
- PUT /b2b/quotes/:id - Update quote
- POST /b2b/quotes/:quoteId/items - Add item to quote
- PUT /b2b/quotes/:quoteId/items/:itemId - Update quote item
- DELETE /b2b/quotes/:quoteId/items/:itemId - Remove quote item
- POST /b2b/quotes/:id/send - Send quote to customer
- DELETE /b2b/quotes/:id - Delete quote

## Prerequisites

- Server must be running (`yarn dev`)
- Database must be migrated and seeded
- Valid admin credentials in testConstants.ts
