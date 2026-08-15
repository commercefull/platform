# Loyalty Feature

## Overview

The Loyalty feature manages customer loyalty programs including points earning, tier progression, and reward redemption. It incentivizes repeat purchases and customer engagement.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-LOY-001 | List Tiers | Merchant/Admin | List all loyalty tier configurations with points thresholds and benefits |
| UC-LOY-002 | Get Tier | Merchant/Admin | Retrieve a specific loyalty tier by ID |
| UC-LOY-003 | Create Tier | Merchant/Admin | Create a loyalty tier with min/max points, multiplier, and benefits |
| UC-LOY-004 | Update Tier | Merchant/Admin | Update an existing loyalty tier's configuration |
| UC-LOY-005 | List Rewards | Merchant/Admin | List all available loyalty rewards |
| UC-LOY-006 | Get Reward | Merchant/Admin | Retrieve a specific loyalty reward by ID |
| UC-LOY-007 | Create Reward | Merchant/Admin | Create a redeemable reward (discount, product, shipping, experience) with optional tier restriction and stock |
| UC-LOY-008 | Update Reward | Merchant/Admin | Update an existing reward's configuration |
| UC-LOY-009 | Get Customer Points | Merchant/Admin | Retrieve a customer's loyalty points balance |
| UC-LOY-010 | Get Customer Transactions | Merchant/Admin | Retrieve a customer's loyalty transaction history with optional filtering |
| UC-LOY-011 | Adjust Customer Points | Merchant/Admin | Manually credit or debit a customer's points with a reason and audit trail |
| UC-LOY-012 | Get Customer Redemptions | Merchant/Admin | Retrieve a customer's reward redemption history |
| UC-LOY-013 | Update Redemption Status | Merchant/Admin | Update a redemption's status (pending, fulfilled, cancelled) |
| UC-LOY-014 | Process Order Points | System/Merchant | Award loyalty points for a completed order based on order value and tier multiplier |
| UC-LOY-015 | Get Public Tiers | Customer/Guest | Retrieve public loyalty tier information for display |
| UC-LOY-016 | Get Public Rewards | Customer/Guest | Retrieve available rewards for display |
| UC-LOY-017 | Get My Loyalty Status | Customer | Retrieve the authenticated customer's current tier and points balance |
| UC-LOY-018 | Get My Transactions | Customer | Retrieve the customer's own loyalty transaction history |
| UC-LOY-019 | Get My Redemptions | Customer | Retrieve the customer's own reward redemption history |
| UC-LOY-020 | Redeem Reward | Customer | Redeem a reward by spending loyalty points, creating a redemption record |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-LOY-001 | GET | `/business/loyalty/tiers` |
| UC-LOY-002 | GET | `/business/loyalty/tiers/:id` |
| UC-LOY-003 | POST | `/business/loyalty/tiers` |
| UC-LOY-004 | PUT | `/business/loyalty/tiers/:id` |
| UC-LOY-005 | GET | `/business/loyalty/rewards` |
| UC-LOY-006 | GET | `/business/loyalty/rewards/:id` |
| UC-LOY-007 | POST | `/business/loyalty/rewards` |
| UC-LOY-008 | PUT | `/business/loyalty/rewards/:id` |
| UC-LOY-009 | GET | `/business/loyalty/customers/:customerId/points` |
| UC-LOY-010 | GET | `/business/loyalty/customers/:customerId/transactions` |
| UC-LOY-011 | POST | `/business/loyalty/customers/:customerId/points/adjust` |
| UC-LOY-012 | GET | `/business/loyalty/customers/:customerId/redemptions` |
| UC-LOY-013 | PUT | `/business/loyalty/redemptions/:id/status` |
| UC-LOY-014 | POST | `/business/loyalty/orders/:orderId/points` |
| UC-LOY-015 | GET | `/loyalty/tiers` |
| UC-LOY-016 | GET | `/loyalty/rewards` |
| UC-LOY-017 | GET | `/loyalty/my-status` |
| UC-LOY-018 | GET | `/loyalty/my-transactions` |
| UC-LOY-019 | GET | `/loyalty/my-redemptions` |
| UC-LOY-020 | POST | `/loyalty/redeem` |

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
| UC-LOY-001 to UC-LOY-004 | `loyalty/loyalty.test.ts`  | ✅     |
| UC-LOY-005 to UC-LOY-008 | `loyalty/loyalty.test.ts`  | ✅     |
| UC-LOY-009 to UC-LOY-014 | `loyalty/loyalty.test.ts`  | ✅     |
| UC-LOY-015 to UC-LOY-020 | `loyalty/loyalty.test.ts`  | ✅     |
