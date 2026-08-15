# Checkout Feature

## Overview

The Checkout feature manages the checkout flow, transforming a basket into an order by collecting shipping, billing, and payment information through a multi-step process.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-CHK-001 | Get Payment Methods | Customer/Guest | Retrieve all active payment methods with provider configuration |
| UC-CHK-002 | Initiate Checkout | Customer/Guest | Create a checkout session from a basket, lock items and prices |
| UC-CHK-003 | Get Checkout Session | Customer/Guest | Retrieve the current checkout state with all collected info and totals |
| UC-CHK-004 | Set Shipping Address | Customer/Guest | Validate and save shipping address, triggering shipping method and tax recalculation |
| UC-CHK-005 | Get Shipping Methods | Customer/Guest | Retrieve available shipping options with costs and delivery estimates for the set address |
| UC-CHK-006 | Set Shipping Method | Customer/Guest | Select a shipping method and recalculate checkout totals |
| UC-CHK-007 | Set Payment Method | Customer/Guest | Save the selected payment method and optional provider token for processing |
| UC-CHK-008 | Apply Coupon Code | Customer/Guest | Apply a valid coupon to the checkout and recalculate totals with discount |
| UC-CHK-009 | Remove Coupon Code | Customer/Guest | Remove an applied coupon and recalculate totals without discount |
| UC-CHK-010 | Complete Checkout | Customer/Guest | Finalize checkout by creating an order, processing payment, reserving inventory, and sending confirmation |
| UC-CHK-011 | Abandon Checkout | Customer/Guest | Mark a checkout as abandoned, unlock the basket, and trigger recovery flow |
| UC-CHK-012 | Set Guest Email | Guest | Store an email address for guest checkout order communication |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-CHK-001 | GET | `/checkout/payment-methods` |
| UC-CHK-002 | POST | `/checkout` |
| UC-CHK-003 | GET | `/checkout/:checkoutId` |
| UC-CHK-004 | PUT | `/checkout/:checkoutId/shipping-address` |
| UC-CHK-005 | GET | `/checkout/:checkoutId/shipping-methods` |
| UC-CHK-006 | PUT | `/checkout/:checkoutId/shipping-method` |
| UC-CHK-007 | PUT | `/checkout/:checkoutId/payment-method` |
| UC-CHK-008 | POST | `/checkout/:checkoutId/coupon` |
| UC-CHK-009 | DELETE | `/checkout/:checkoutId/coupon` |
| UC-CHK-010 | POST | `/checkout/:checkoutId/complete` |
| UC-CHK-011 | POST | `/checkout/:checkoutId/abandon` |
| UC-CHK-012 | PUT | `/checkout/:checkoutId/guest-email` |

---

## Checkout Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Basket    │ ──▶ │  Initiate   │ ──▶ │  Shipping   │
│   Ready     │     │  Checkout   │     │  Address    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Order     │ ◀── │   Payment   │ ◀── │  Shipping   │
│   Created   │     │   Method    │     │   Method    │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Events Emitted

| Event                        | Trigger            | Payload                   |
| ---------------------------- | ------------------ | ------------------------- |
| `checkout.started`           | Checkout initiated | checkoutId, basketId      |
| `checkout.updated`           | Checkout modified  | checkoutId, field         |
| `checkout.completed`         | Order created      | checkoutId, orderId       |
| `checkout.abandoned`         | Checkout abandoned | checkoutId, basketId      |
| `checkout.payment_initiated` | Payment started    | checkoutId, amount        |
| `checkout.payment_completed` | Payment successful | checkoutId, transactionId |
| `checkout.payment_failed`    | Payment failed     | checkoutId, reason        |

---

## Integration Test Coverage

| Use Case   | Test File                   | Status |
| ---------- | --------------------------- | ------ |
| UC-CHK-001 | `checkout/checkout.test.ts` | ✅     |
| UC-CHK-002 | `checkout/checkout.test.ts` | ✅     |
| UC-CHK-003 | `checkout/checkout.test.ts` | ✅     |
| UC-CHK-004 | `checkout/checkout.test.ts` | ✅     |
| UC-CHK-005 | `checkout/checkout.test.ts` | 🟡     |
| UC-CHK-006 | `checkout/checkout.test.ts` | ✅     |
| UC-CHK-007 | `checkout/checkout.test.ts` | ✅     |
| UC-CHK-008 | `checkout/checkout.test.ts` | 🟡     |
| UC-CHK-009 | `checkout/checkout.test.ts` | ❌     |
| UC-CHK-010 | `checkout/checkout.test.ts` | ✅     |
| UC-CHK-011 | `checkout/checkout.test.ts` | ❌     |
| UC-CHK-012 | `checkout/checkout.test.ts` | ❌     |
