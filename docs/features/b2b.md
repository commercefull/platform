# B2B Feature

## Overview

The B2B (Business-to-Business) feature enables wholesale and corporate customer management. It includes company accounts, multi-user access, quote management, and approval workflows for purchase orders.

---

## Use Cases

### Company Management (Business)

### UC-B2B-001: List Companies (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request companies  
**Then** the system returns all B2B company accounts

#### API Endpoint
```
GET /business/b2b/companies
Query: status?, search?, limit, offset
```

---

### UC-B2B-002: Get Company (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
GET /business/b2b/companies/:id
```

---

### UC-B2B-003: Create Company (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid company data  
**When** they create a company  
**Then** the B2B account is created

#### API Endpoint
```
POST /business/b2b/companies
Body: {
  name, taxId, industry?,
  creditLimit?, paymentTerms?,
  primaryContact: { name, email, phone },
  billingAddress, shippingAddress?
}
```

#### Business Rules
- Company name must be unique
- Tax ID validation
- Credit limit determines purchasing power
- Payment terms (net30, net60, etc.)

---

### UC-B2B-004: Update Company (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/b2b/companies/:id
```

---

### UC-B2B-005: Approve Company (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** a pending company registration  
**When** the admin approves it  
**Then** the company can start purchasing

#### API Endpoint
```
POST /business/b2b/companies/:id/approve
```

---

### UC-B2B-006: Suspend Company (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/b2b/companies/:id/suspend
Body: { reason }
```

---

### UC-B2B-007: Delete Company (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/b2b/companies/:id
```

---

### Company Users (Business)

### UC-B2B-008: List Company Users (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
GET /business/b2b/companies/:companyId/users
```

---

### UC-B2B-009: Create Company User (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an existing company  
**When** adding a user  
**Then** the user can access the company account

#### API Endpoint
```
POST /business/b2b/companies/:companyId/users
Body: {
  email, firstName, lastName,
  role: 'admin'|'buyer'|'viewer',
  spendingLimit?, requiresApproval?
}
```

#### Business Rules
- Roles: admin (full access), buyer (can purchase), viewer (read-only)
- Spending limits per user
- Approval requirements based on amount

---

### UC-B2B-010: Update Company User (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/b2b/companies/:companyId/users/:userId
```

---

### UC-B2B-011: Delete Company User (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/b2b/companies/:companyId/users/:userId
```

---

### Company Addresses (Business)

### UC-B2B-012: List Company Addresses (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/b2b/companies/:companyId/addresses
```

---

### UC-B2B-013: Create Company Address (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/b2b/companies/:companyId/addresses
Body: { label, addressLine1, city, state, postalCode, country, isDefault? }
```

---

### UC-B2B-014: Update Company Address (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
PUT /business/b2b/companies/:companyId/addresses/:addressId
```

---

### UC-B2B-015: Delete Company Address (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/b2b/companies/:companyId/addresses/:addressId
```

---

### Quote Management (Business)

### UC-B2B-016: List Quotes (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request quotes  
**Then** the system returns all quote requests

#### API Endpoint
```
GET /business/b2b/quotes
Query: companyId?, status?, limit, offset
```

---

### UC-B2B-017: Get Quote (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
GET /business/b2b/quotes/:id
```

---

### UC-B2B-018: Create Quote (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** a company and products  
**When** creating a quote  
**Then** a custom pricing proposal is created

#### API Endpoint
```
POST /business/b2b/quotes
Body: {
  companyId, contactId?,
  items: [{ productId, quantity, customPrice? }],
  validUntil, notes?
}
```

#### Business Rules
- Quotes have expiration dates
- Custom pricing per item
- Can include volume discounts

---

### UC-B2B-019: Update Quote (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/b2b/quotes/:id
```

---

### UC-B2B-020: Send Quote (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** a draft quote  
**When** sending to the company  
**Then** the quote is emailed and status changes

#### API Endpoint
```
POST /business/b2b/quotes/:id/send
```

---

### UC-B2B-021: Delete Quote (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/b2b/quotes/:id
```

---

### UC-B2B-022: Add Quote Item (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/b2b/quotes/:id/items
Body: { productId, quantity, customPrice? }
```

---

### UC-B2B-023: Update Quote Item (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/b2b/quotes/:id/items/:itemId
```

---

### UC-B2B-024: Delete Quote Item (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/b2b/quotes/:id/items/:itemId
```

---

### Approval Workflows (Business)

### UC-B2B-025: List Workflows (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/b2b/workflows
```

---

### UC-B2B-026: Create Workflow (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** creating an approval workflow  
**Then** orders matching criteria require approval

#### API Endpoint
```
POST /business/b2b/workflows
Body: {
  name, companyId?,
  conditions: { minAmount?, productCategories? },
  approvers: [{ userId, level }],
  isActive
}
```

#### Business Rules
- Multi-level approval chains
- Amount-based triggers
- Category-based triggers

---

### UC-B2B-027: Update Workflow (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
PUT /business/b2b/workflows/:id
```

---

### UC-B2B-028: Delete Workflow (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/b2b/workflows/:id
```

---

### Approval Requests (Business)

### UC-B2B-029: List Approval Requests (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
GET /business/b2b/approvals
Query: status?, companyId?, limit, offset
```

---

### UC-B2B-030: Get Approval Request (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
GET /business/b2b/approvals/:id
```

---

### UC-B2B-031: Process Approval Action (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** a pending approval request  
**When** an approver takes action  
**Then** the request is approved/rejected

#### API Endpoint
```
POST /business/b2b/approvals/:id/action
Body: { action: 'approve'|'reject', notes? }
```

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `b2b.company.created` | Company created | companyId |
| `b2b.company.approved` | Company approved | companyId |
| `b2b.company.suspended` | Company suspended | companyId, reason |
| `b2b.quote.created` | Quote created | quoteId, companyId |
| `b2b.quote.sent` | Quote sent | quoteId |
| `b2b.quote.accepted` | Quote accepted | quoteId, orderId |
| `b2b.approval.requested` | Approval needed | requestId, orderId |
| `b2b.approval.approved` | Request approved | requestId |
| `b2b.approval.rejected` | Request rejected | requestId |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-B2B-001 to UC-B2B-007 | `b2b/companies.test.ts` | ❌ |
| UC-B2B-008 to UC-B2B-011 | `b2b/users.test.ts` | ❌ |
| UC-B2B-012 to UC-B2B-015 | `b2b/addresses.test.ts` | ❌ |
| UC-B2B-016 to UC-B2B-024 | `b2b/quotes.test.ts` | ❌ |
| UC-B2B-025 to UC-B2B-031 | `b2b/approvals.test.ts` | ❌ |
