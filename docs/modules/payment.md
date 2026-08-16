# Payment Feature

## Overview

The Payment feature handles all payment processing including transactions, refunds, and fraud prevention. It integrates with payment providers and manages the complete payment lifecycle.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-PAY-001 | Get Payment Methods | Customer/Guest | Retrieve all active payment methods for checkout display (no auth required) |
| UC-PAY-002 | Get My Transactions | Customer | Retrieve the authenticated customer's own payment transaction history |
| UC-PAY-003 | Get Transaction by Order | Customer | Retrieve all payment and refund transactions for a specific order |
| UC-PAY-004 | List Transactions | Merchant/Admin | List all transactions with optional status/customer/date filtering |
| UC-PAY-005 | Get Transaction Details | Merchant/Admin | Retrieve full transaction details including provider response and order info |
| UC-PAY-006 | Initiate Payment | Merchant/Admin | Process a payment through the appropriate provider and create a transaction record |
| UC-PAY-007 | Get Refunds for Transaction | Merchant/Admin | Retrieve all refunds (partial and full) processed for a specific transaction |
| UC-PAY-008 | Process Refund | Merchant/Admin | Process a full or partial refund via the payment provider with a required reason |
| UC-PAY-009 | Get Fraud Rules | Merchant/Admin | List all configured fraud prevention rules with optional active-only filter |
| UC-PAY-010 | Get Fraud Rule | Merchant/Admin | Retrieve a specific fraud rule configuration by ID |
| UC-PAY-011 | Create Fraud Rule | Merchant/Admin | Create a fraud rule (velocity, geolocation, amount, pattern, blacklist, custom) with an action (allow, flag, review, block) |
| UC-PAY-012 | Update Fraud Rule | Merchant/Admin | Update an existing fraud rule's conditions, action, or active status |
| UC-PAY-013 | Delete Fraud Rule | Merchant/Admin | Deactivate a fraud rule |
| UC-PAY-014 | Get Fraud Checks | Merchant/Admin | List fraud check results with optional status/risk level/customer filtering |
| UC-PAY-015 | Get Fraud Check | Merchant/Admin | Retrieve full details of a specific fraud check by ID |
| UC-PAY-016 | Get Pending Reviews | Merchant/Admin | Retrieve fraud checks that require manual review |
| UC-PAY-017 | Review Fraud Check | Merchant/Admin | Submit a manual review decision (approve or reject) for a flagged fraud check |
| UC-PAY-018 | Get Blacklist | Merchant/Admin | List blacklisted entities (email, IP, card, phone, device) with optional type/active filtering |
| UC-PAY-019 | Add to Blacklist | Merchant/Admin | Add an entity to the fraud blacklist with a required reason |
| UC-PAY-020 | Remove from Blacklist | Merchant/Admin | Deactivate a blacklist entry |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-PAY-001 | GET | `/payment/methods` |
| UC-PAY-002 | GET | `/payment/transactions` |
| UC-PAY-003 | GET | `/payment/orders/:orderId` |
| UC-PAY-004 | GET | `/business/payments/transactions` |
| UC-PAY-005 | GET | `/business/payments/transactions/:transactionId` |
| UC-PAY-006 | POST | `/business/payments/transactions` |
| UC-PAY-007 | GET | `/business/payments/transactions/:transactionId/refunds` |
| UC-PAY-008 | POST | `/business/payments/transactions/:transactionId/refund` |
| UC-PAY-009 | GET | `/business/payments/fraud/rules` |
| UC-PAY-010 | GET | `/business/payments/fraud/rules/:id` |
| UC-PAY-011 | POST | `/business/payments/fraud/rules` |
| UC-PAY-012 | PUT | `/business/payments/fraud/rules/:id` |
| UC-PAY-013 | DELETE | `/business/payments/fraud/rules/:id` |
| UC-PAY-014 | GET | `/business/payments/fraud/checks` |
| UC-PAY-015 | GET | `/business/payments/fraud/checks/:id` |
| UC-PAY-016 | GET | `/business/payments/fraud/reviews` |
| UC-PAY-017 | POST | `/business/payments/fraud/checks/:id/review` |
| UC-PAY-018 | GET | `/business/payments/fraud/blacklist` |
| UC-PAY-019 | POST | `/business/payments/fraud/blacklist` |
| UC-PAY-020 | DELETE | `/business/payments/fraud/blacklist/:id` |

---

## Events Emitted

| Event                   | Trigger                | Payload                        |
| ----------------------- | ---------------------- | ------------------------------ |
| `payment.received`      | Payment captured       | transactionId, orderId, amount |
| `payment.failed`        | Payment failed         | transactionId, reason          |
| `payment.success`       | Payment succeeded      | transactionId, orderId, amount |
| `payment.refunded`      | Refund processed       | transactionId, refundAmount    |
| `fraud.check.created`   | Fraud check run        | checkId, orderId, riskScore    |
| `fraud.check.flagged`   | High risk detected     | checkId, riskLevel             |
| `fraud.check.blocked`   | Transaction blocked    | checkId, reason                |
| `fraud.check.reviewed`  | Manual review complete | checkId, decision              |
| `fraud.blacklist.added` | Blacklist entry added  | type, value                    |

---

## Integration Test Coverage

| Use Case   | Test File                       | Status |
| ---------- | ------------------------------- | ------ |
| UC-PAY-001 | `payment/payment.test.ts`       | ✅     |
| UC-PAY-002 | `payment/payment.test.ts`       | ✅     |
| UC-PAY-003 | `payment/payment.test.ts`       | ✅     |
| UC-PAY-004 | `payment/gateway.test.ts`       | ✅     |
| UC-PAY-005 | `payment/gateway.test.ts`       | ✅     |
| UC-PAY-006 | `payment/methodConfig.test.ts`  | ✅     |
| UC-PAY-007 | `payment/methodConfig.test.ts`  | ✅     |
| UC-PAY-008 | `payment/transaction.test.ts`   | ✅     |
| UC-PAY-009 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-010 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-011 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-012 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-013 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-014 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-015 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-016 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-017 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-018 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-019 | `payment/fraud.test.ts`         | ✅     |
| UC-PAY-020 | `payment/fraud.test.ts`         | ✅     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/fraud/blacklist` | `getBlacklist` | — |
| POST | `/business/fraud/blacklist` | `addToBlacklist` | — |
| DELETE | `/business/fraud/blacklist/:id` | `removeFromBlacklist` | — |
| GET | `/business/fraud/checks` | `getFraudChecks` | — |
| GET | `/business/fraud/checks/:id` | `getFraudCheck` | — |
| POST | `/business/fraud/checks/:id/review` | `reviewFraudCheck` | — |
| GET | `/business/fraud/reviews` | `getPendingReviews` | — |
| GET | `/business/fraud/rules` | `getFraudRules` | Fraud Prevention routes |
| POST | `/business/fraud/rules` | `createFraudRule` | — |
| GET | `/business/fraud/rules/:id` | `getFraudRule` | — |
| PUT | `/business/fraud/rules/:id` | `updateFraudRule` | — |
| DELETE | `/business/fraud/rules/:id` | `deleteFraudRule` | — |
| GET | `/business/gateways` | `listGateways` | ============================================================================ Gateway Routes ============================================================================ |
| POST | `/business/gateways` | `createGateway` | — |
| GET | `/business/gateways/:gatewayId` | `getGateway` | — |
| PUT | `/business/gateways/:gatewayId` | `updateGateway` | — |
| DELETE | `/business/gateways/:gatewayId` | `deleteGateway` | — |
| GET | `/business/method-configs` | `listMethodConfigs` | ============================================================================ Method Config Routes ============================================================================ |
| POST | `/business/method-configs` | `createMethodConfig` | — |
| GET | `/business/method-configs/:methodConfigId` | `getMethodConfig` | — |
| PUT | `/business/method-configs/:methodConfigId` | `updateMethodConfig` | — |
| DELETE | `/business/method-configs/:methodConfigId` | `deleteMethodConfig` | — |
| GET | `/business/payment/balance` | `getBalance` | ============================================================================ Balance Routes ============================================================================ |
| GET | `/business/payment/disputes` | `listDisputes` | ============================================================================ Dispute Routes ============================================================================ |
| POST | `/business/payment/disputes` | `listDisputes` | — |
| GET | `/business/payment/disputes/:disputeId` | `getDispute` | — |
| PATCH | `/business/payment/disputes/:disputeId` | `updateDisputeStatus` | — |
| GET | `/business/payment/fees` | `listFees` | ============================================================================ Fee Routes ============================================================================ |
| GET | `/business/payment/reports` | `listReports` | ============================================================================ Report Routes ============================================================================ |
| GET | `/business/payment/settings` | `getSettings` | ============================================================================ Settings Routes ============================================================================ |
| POST | `/business/payment/settings` | `updateSettings` | — |
| GET | `/business/transactions` | `listTransactions` | ============================================================================ Transaction Routes ============================================================================ |
| POST | `/business/transactions` | `initiatePayment` | — |
| GET | `/business/transactions/:transactionId` | `getTransaction` | — |
| DELETE | `/business/transactions/:transactionId` | `deleteTransaction` | — |
| POST | `/business/transactions/:transactionId/refund` | `processRefund` | — |
| GET | `/business/transactions/:transactionId/refunds` | `getRefunds` | — |
| GET | `/customer/payment-methods` | `listStoredMethods` | — |
| POST | `/customer/payment-methods` | `saveStoredMethod` | — |
| DELETE | `/customer/payment-methods/:methodId` | `deleteStoredMethod` | — |
| POST | `/customer/payment-methods/:methodId/default` | `setDefaultMethod` | — |
| GET | `/customer/payment/methods` | `getPaymentMethods` | Get available payment methods
GET /payments/methods |
| GET | `/customer/payment/orders/:orderId` | `getTransactionByOrder` | Get transactions for an order
GET /payments/orders/:orderId |
| GET | `/customer/payment/transactions` | `getMyTransactions` | Get my transactions
GET /payments/transactions |

<!-- GENERATED:ENDPOINTS:END -->
