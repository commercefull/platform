# Returns Module

## Overview

The Returns module provides return, exchange, and store credit management — explicit state machine for return lifecycle, carrier return labels, store-credit ledger, and warranty claims.

---

## Public API (`index.ts`)

| Export | Type | Description |
|---|---|---|
| `ReturnRequest` | Entity | Return request with items and status lifecycle |
| `StoreCredit` | Entity | Store credit ledger entry |
| `ReturnRepository` | Port | Repository interface |
| `ReturnErrors` | Errors | Domain error classes |

---

## Domain Entities

| Entity | Description |
|---|---|
| `ReturnRequest` | `returnId`, `orderId`, items[], reason, status (created/approved/denied/in_transit/received/inspected/completed/cancelled), carrier, trackingNumber, refundAmount |
| `StoreCredit` | `storeCreditId`, `customerId`, balance, transactions[], status (active/redeemed/expired) |

## Domain Errors

| Error | Code | Status |
|---|---|---|
| `ReturnNotFoundError` | `returns.not_found` | 404 |
| `ReturnValidationError` | `returns.validation_error` | 400 |
| `StoreCreditNotFoundError` | `returns.store_credit_not_found` | 404 |
| `StoreCreditInsufficientError` | `returns.store_credit_insufficient` | 400 |

## Events

| Direction | Events |
|---|---|
| Publishes | `return.created`, `return.approved`, `return.denied`, `return.in_transit`, `return.received`, `return.inspected`, `return.completed`, `return.cancelled` |
| Subscribes | `order.completed`, `order.cancelled` |

## Tables

| Table | Description |
|---|---|
| `orderReturn` | Return requests with items and status |
| `orderReturnItem` | Individual return line items |
| `storeCreditLedger` | Store credit balances and transactions |

## Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/business/returns` | Create return request |
| GET | `/business/returns` | List returns |
| GET | `/business/returns/:id` | Get return details |
| PUT | `/business/returns/:id/approve` | Approve return |
| PUT | `/business/returns/:id/deny` | Deny return |
| PUT | `/business/returns/:id/receive` | Mark return received |
| PUT | `/business/returns/:id/complete` | Complete return with refund |
| GET | `/business/store-credit` | List store credit balances |
| GET | `/business/store-credit/:customerId` | Get customer store credit |
