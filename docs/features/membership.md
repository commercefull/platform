# Membership Feature

## Overview

The Membership feature manages paid membership tiers with exclusive benefits. Unlike loyalty (points-based), membership provides subscription-based access to premium features, discounts, and perks.

---

## Use Cases

### Tier Management (Business)

### UC-MEM-001: List Membership Tiers (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request membership tiers  
**Then** the system returns all tier configurations

#### API Endpoint
```
GET /business/membership/tiers
```

---

### UC-MEM-002: Get Membership Tier (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/membership/tiers/:id
```

---

### UC-MEM-003: Create Membership Tier (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid tier configuration  
**When** they create a tier  
**Then** customers can subscribe to it

#### API Endpoint
```
POST /business/membership/tiers
Body: {
  name, slug, description,
  price, billingPeriod: 'monthly'|'yearly',
  trialDays?,
  isActive
}
```

#### Business Rules
- Tiers have recurring pricing
- Can offer trial periods
- Benefits are linked separately

---

### UC-MEM-004: Update Membership Tier (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/membership/tiers/:id
```

---

### UC-MEM-005: Delete Membership Tier (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/membership/tiers/:id
```

---

### Benefit Management (Business)

### UC-MEM-006: List Membership Benefits (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
GET /business/membership/benefits
```

---

### UC-MEM-007: Get Membership Benefit (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/membership/benefits/:id
```

---

### UC-MEM-008: Create Membership Benefit (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid benefit configuration  
**When** they create a benefit  
**Then** it can be assigned to tiers

#### API Endpoint
```
POST /business/membership/benefits
Body: {
  name, description,
  benefitType: 'discount'|'free_shipping'|'early_access'|'exclusive_products',
  benefitValue,
  tierIds: []
}
```

---

### UC-MEM-009: Update Membership Benefit (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/membership/benefits/:id
```

---

### UC-MEM-010: Delete Membership Benefit (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/membership/benefits/:id
```

---

### User Membership Management (Business)

### UC-MEM-011: List User Memberships (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request user memberships  
**Then** the system returns all active memberships

#### API Endpoint
```
GET /business/membership/user-memberships
Query: tierId?, status?, limit, offset
```

---

### UC-MEM-012: Get User Membership (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/membership/user-memberships/:id
```

---

### UC-MEM-013: Create User Membership (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a user and tier  
**When** creating a membership  
**Then** the user gains membership benefits

#### API Endpoint
```
POST /business/membership/user-memberships
Body: { userId, tierId, startDate?, endDate? }
```

---

### UC-MEM-014: Update User Membership (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/membership/user-memberships/:id
Body: { tierId?, endDate?, status? }
```

---

### UC-MEM-015: Cancel User Membership (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/membership/user-memberships/:id/cancel
Body: { reason?, cancelAt?: 'immediate'|'period_end' }
```

---

### UC-MEM-016: Get User Membership by User (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/membership/users/:userId/membership
```

---

### UC-MEM-017: Get User Membership Benefits (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/membership/users/:userId/benefits
```

---

### Customer-Facing Use Cases

### UC-MEM-018: Get Membership Tiers (Customer)
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** any user  
**When** they request membership tiers  
**Then** the system returns available tiers

#### API Endpoint
```
GET /membership/tiers
```

---

### UC-MEM-019: Get Membership Tier Details (Customer)
**Actor:** Customer/Guest  
**Priority:** Medium

#### API Endpoint
```
GET /membership/tiers/:id
```

---

### UC-MEM-020: Get Tier Benefits (Customer)
**Actor:** Customer/Guest  
**Priority:** Medium

#### API Endpoint
```
GET /membership/tiers/:tierId/benefits
```

---

### UC-MEM-021: Get My Membership (Customer)
**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**When** they request their membership  
**Then** the system returns their current membership

#### API Endpoint
```
GET /membership/user/:userId
```

---

### UC-MEM-022: Get My Benefits (Customer)
**Actor:** Customer  
**Priority:** High

#### API Endpoint
```
GET /membership/user/:userId/benefits
```

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `membership.created` | Membership started | membershipId, userId, tierId |
| `membership.renewed` | Membership renewed | membershipId |
| `membership.upgraded` | Tier upgraded | membershipId, oldTierId, newTierId |
| `membership.downgraded` | Tier downgraded | membershipId, oldTierId, newTierId |
| `membership.cancelled` | Membership cancelled | membershipId, reason |
| `membership.expired` | Membership expired | membershipId |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-MEM-001 to UC-MEM-005 | `membership/tiers.test.ts` | 🟡 |
| UC-MEM-006 to UC-MEM-010 | `membership/benefits.test.ts` | 🟡 |
| UC-MEM-011 to UC-MEM-017 | `membership/admin.test.ts` | ❌ |
| UC-MEM-018 to UC-MEM-022 | `membership/customer.test.ts` | 🟡 |
