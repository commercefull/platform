# Marketplace Module

## Overview

The Marketplace module provides multi-vendor marketplace capabilities — vendor onboarding, commission rules (percentage/fixed/tiered), payout processing, and order splitting.

---

## Public API (`index.ts`)

| Export | Type | Description |
|---|---|---|
| `Vendor` | Entity | Marketplace vendor with status lifecycle |
| `CommissionRule` | Entity | Commission configuration (percentage/fixed/tiered) |
| `VendorPayout` | Entity | Payout record with line items and status |
| `MarketplaceRepository` | Port | Repository interface |
| `MarketplaceErrors` | Errors | Domain error classes |
| `marketplaceController` | Controller | Wired controller instance |
| `marketplaceBusinessRouter` | Router | Express router at `/business/marketplace` |

---

## Domain Entities

| Entity | Description |
|---|---|
| `Vendor` | `vendorId`, `organizationId`, name, email, status (pending/approved/suspended/terminated), commissionRuleId, bank details |
| `CommissionRule` | `commissionRuleId`, type (percentage/fixed/tiered), rate, fixedAmount, tiers[], status |
| `VendorPayout` | `vendorPayoutId`, `vendorId`, line items, totalAmount, status (pending/processing/completed/failed/cancelled), payoutMethod |

## Domain Errors

| Error | Code | Status |
|---|---|---|
| `VendorNotFoundError` | `marketplace.vendor_not_found` | 404 |
| `MarketplaceValidationError` | `marketplace.validation_error` | 400 |
| `CommissionRuleNotFoundError` | `marketplace.commission_not_found` | 404 |
| `PayoutNotFoundError` | `marketplace.payout_not_found` | 404 |

## Events

| Direction | Events |
|---|---|
| Publishes | `marketplace.vendor.registered`, `marketplace.vendor.approved`, `marketplace.vendor.suspended`, `marketplace.vendor.terminated`, `marketplace.commission.created`, `marketplace.commission.updated`, `marketplace.payout.created`, `marketplace.payout.processing`, `marketplace.payout.completed`, `marketplace.payout.failed` |
| Subscribes | (none) |

## Tables

| Table | Description |
|---|---|
| `marketplaceVendor` | Vendor registrations with status and bank details |
| `marketplaceCommissionRule` | Commission rules with type and rate configuration |
| `marketplaceVendorPayout` | Payout records with line items and status |

## Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/business/marketplace/vendors` | Register vendor |
| GET | `/business/marketplace/vendors` | List vendors |
| GET | `/business/marketplace/vendors/:id` | Get vendor details |
| PUT | `/business/marketplace/vendors/:id/approve` | Approve vendor |
| PUT | `/business/marketplace/vendors/:id/suspend` | Suspend vendor |
| POST | `/business/marketplace/commissions` | Create commission rule |
| GET | `/business/marketplace/commissions` | List commission rules |
| POST | `/business/marketplace/payouts` | Create payout |
| GET | `/business/marketplace/payouts` | List payouts |
| PUT | `/business/marketplace/payouts/:id/process` | Start payout processing |
| PUT | `/business/marketplace/payouts/:id/complete` | Complete payout |
