# Merchant Feature

## Overview

The Merchant feature manages merchant/seller accounts in a multi-vendor marketplace setup. It handles merchant profiles, addresses, and payment information for commission payouts.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-MER-001 | List Merchants | Admin | List all merchant accounts with optional status/search filtering |
| UC-MER-002 | Create Merchant | Admin | Create a new merchant account with unique email and commission rate |
| UC-MER-003 | Get Merchant | Admin | Retrieve a specific merchant account by ID |
| UC-MER-004 | Update Merchant | Admin | Update a merchant's name, commission rate, or status |
| UC-MER-005 | Delete Merchant | Admin | Permanently delete a merchant account |
| UC-MER-006 | Get Merchant Addresses | Admin | Retrieve all addresses associated with a merchant |
| UC-MER-007 | Add Merchant Address | Admin | Add a business, warehouse, or return address to a merchant |
| UC-MER-008 | Get Merchant Payment Info | Admin | Retrieve a merchant's payment method details for payouts |
| UC-MER-009 | Add Merchant Payment Info | Admin | Add a payment method (bank transfer, PayPal, Stripe) for merchant commission payouts |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-MER-001 | GET | `/business/merchants` |
| UC-MER-002 | POST | `/business/merchants` |
| UC-MER-003 | GET | `/business/merchants/:id` |
| UC-MER-004 | PUT | `/business/merchants/:id` |
| UC-MER-005 | DELETE | `/business/merchants/:id` |
| UC-MER-006 | GET | `/business/merchants/:merchantId/addresses` |
| UC-MER-007 | POST | `/business/merchants/:merchantId/addresses` |
| UC-MER-008 | GET | `/business/merchants/:merchantId/payment-info` |
| UC-MER-009 | POST | `/business/merchants/:merchantId/payment-info` |

---

## Events Emitted

| Event                       | Trigger            | Payload            |
| --------------------------- | ------------------ | ------------------ |
| `merchant.created`          | Merchant created   | merchantId         |
| `merchant.approved`         | Merchant approved  | merchantId         |
| `merchant.suspended`        | Merchant suspended | merchantId, reason |
| `merchant.payout.processed` | Payout sent        | merchantId, amount |

---

## Integration Test Coverage

| Use Case                 | Test File                    | Status |
| ------------------------ | ---------------------------- | ------ |
| UC-MER-001 to UC-MER-005 | `merchant/merchant.test.ts`  | ✅     |
| UC-MER-006 to UC-MER-007 | `merchant/merchant.test.ts`  | ✅     |
| UC-MER-008 to UC-MER-009 | `merchant/merchant.test.ts`  | ✅     |
