# Loyalty Feature

## Overview

The Loyalty feature manages customer loyalty programs including points earning, tier progression, and reward redemption. It incentivizes repeat purchases and customer engagement.

---

## Use Cases

### Tier Management (Business)

### UC-LOY-001: List Tiers (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request loyalty tiers  
**Then** the system returns all tier configurations

#### API Endpoint

```
GET /business/loyalty/tiers
```

---

### UC-LOY-002: Get Tier (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/loyalty/tiers/:id
```

---

### UC-LOY-003: Create Tier (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid tier configuration  
**When** they create a tier  
**Then** customers can progress to that tier

#### API Endpoint

```
POST /business/loyalty/tiers
Body: {
  name, slug,
  minPoints, maxPoints?,
  pointsMultiplier,
  benefits: [],
  isActive
}
```

#### Business Rules

- Tiers are ordered by minPoints
- Higher tiers have better multipliers
- Benefits can include discounts, free shipping, etc.

---

### UC-LOY-004: Update Tier (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/loyalty/tiers/:id
```

---

### Reward Management (Business)

### UC-LOY-005: List Rewards (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request rewards  
**Then** the system returns all available rewards

#### API Endpoint

```
GET /business/loyalty/rewards
```

---

### UC-LOY-006: Get Reward (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/loyalty/rewards/:id
```

---

### UC-LOY-007: Create Reward (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid reward configuration  
**When** they create a reward  
**Then** customers can redeem points for it

#### API Endpoint

```
POST /business/loyalty/rewards
Body: {
  name, description,
  pointsCost,
  rewardType: 'discount'|'product'|'shipping'|'experience',
  rewardValue,
  minTierId?,
  stock?,
  isActive
}
```

#### Business Rules

- Rewards can be tier-restricted
- Can have limited stock
- Different reward types available

---

### UC-LOY-008: Update Reward (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/loyalty/rewards/:id
```

---

### Customer Points Management (Business)

### UC-LOY-009: Get Customer Points (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a customer ID  
**When** they request points balance  
**Then** the system returns the customer's points

#### API Endpoint

```
GET /business/loyalty/customers/:customerId/points
```

---

### UC-LOY-010: Get Customer Transactions (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/loyalty/customers/:customerId/transactions
Query: type?, dateFrom?, dateTo?, limit, offset
```

---

### UC-LOY-011: Adjust Customer Points (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a customer  
**When** adjusting their points  
**Then** the balance is updated with audit trail

#### API Endpoint

```
POST /business/loyalty/customers/:customerId/points/adjust
Body: { amount, reason, type: 'credit'|'debit' }
```

---

### UC-LOY-012: Get Customer Redemptions (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/loyalty/customers/:customerId/redemptions
```

---

### UC-LOY-013: Update Redemption Status (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/loyalty/redemptions/:id/status
Body: { status: 'pending'|'fulfilled'|'cancelled' }
```

---

### UC-LOY-014: Process Order Points (Business)

**Actor:** System/Merchant  
**Priority:** High

#### Given-When-Then

**Given** a completed order  
**When** processing loyalty points  
**Then** points are awarded based on order value

#### API Endpoint

```
POST /business/loyalty/orders/:orderId/points
```

#### Business Rules

- Points calculated based on order total
- Tier multiplier applied
- Bonus points for promotions

---

### Customer-Facing Use Cases

### UC-LOY-015: Get Public Tiers (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** any user  
**When** they request loyalty tiers  
**Then** the system returns public tier information

#### API Endpoint

```
GET /loyalty/tiers
```

---

### UC-LOY-016: Get Public Rewards (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### API Endpoint

```
GET /loyalty/rewards
```

---

### UC-LOY-017: Get My Loyalty Status (Customer)

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**When** they request their loyalty status  
**Then** the system returns their tier and points

#### API Endpoint

```
GET /loyalty/my-status
```

---

### UC-LOY-018: Get My Transactions (Customer)

**Actor:** Customer  
**Priority:** Medium

#### API Endpoint

```
GET /loyalty/my-transactions
Query: limit, offset
```

---

### UC-LOY-019: Get My Redemptions (Customer)

**Actor:** Customer  
**Priority:** Medium

#### API Endpoint

```
GET /loyalty/my-redemptions
```

---

### UC-LOY-020: Redeem Reward (Customer)

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**And** sufficient points  
**When** they redeem a reward  
**Then** points are deducted and reward is issued

#### API Endpoint

```
POST /loyalty/redeem
Body: { rewardId }
```

#### Business Rules

- Customer must have enough points
- Reward must be in stock
- Customer must meet tier requirement
- Creates redemption record

---

## Events Emitted

| Event                     | Trigger           | Payload                            |
| ------------------------- | ----------------- | ---------------------------------- |
| `loyalty.points.earned`   | Points awarded    | customerId, points, orderId        |
| `loyalty.points.redeemed` | Points spent      | customerId, points, rewardId       |
| `loyalty.points.adjusted` | Manual adjustment | customerId, points, reason         |
| `loyalty.tier.upgraded`   | Tier promotion    | customerId, oldTier, newTier       |
| `loyalty.tier.downgraded` | Tier demotion     | customerId, oldTier, newTier       |
| `loyalty.reward.redeemed` | Reward claimed    | redemptionId, customerId, rewardId |

---

## Integration Test Coverage

| Use Case                 | Test File                  | Status |
| ------------------------ | -------------------------- | ------ |
| UC-LOY-001 to UC-LOY-004 | `loyalty/tiers.test.ts`    | 🟡     |
| UC-LOY-005 to UC-LOY-008 | `loyalty/rewards.test.ts`  | 🟡     |
| UC-LOY-009 to UC-LOY-014 | `loyalty/admin.test.ts`    | ❌     |
| UC-LOY-015 to UC-LOY-020 | `loyalty/customer.test.ts` | 🟡     |
