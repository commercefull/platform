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

---

## Domain Errors

All errors extend `AppError` and are defined in `modules/payment/domain/errors/PaymentErrors.ts`.

### Transaction Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `TransactionNotFoundError` | `payment.transaction_not_found` | 404 | Transaction not found by ID |
| `TransactionCannotBeCapturedError` | `payment.transaction_cannot_be_captured` | 400 | Transaction is not in a capturable status |
| `CaptureAmountExceedsAuthorizedError` | `payment.capture_amount_exceeds_authorized` | 400 | Capture amount exceeds authorized amount |
| `CaptureFailedError` | `payment.capture_failed` | 502 | Gateway capture operation failed |
| `TransactionCannotBeVoidedError` | `payment.transaction_cannot_be_voided` | 400 | Transaction is not in a voidable status |
| `VoidFailedError` | `payment.void_failed` | 502 | Gateway void operation failed |
| `TransactionCannotBeRefundedError` | `payment.transaction_cannot_be_refunded` | 400 | Transaction is not in a refundable status |
| `RefundAmountExceedsRefundableError` | `payment.refund_amount_exceeds_refundable` | 400 | Refund amount exceeds refundable amount |
| `RefundAmountExceedsRefundableBalanceError` | `payment.refund_exceeds_balance` | 400 | Refund amount exceeds refundable balance |
| `MaxRetryAttemptsReachedError` | `payment.max_retry_attempts` | 400 | Maximum retry attempts reached |
| `CannotRetryTransactionError` | `payment.cannot_retry_transaction` | 400 | Transaction status does not allow retry |

### Validation Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `AmountMustBePositiveError` | `payment.amount_must_be_positive` | 400 | Amount must be greater than zero |
| `RefundAmountMustBePositiveError` | `payment.refund_amount_must_be_positive` | 400 | Refund amount must be greater than zero |
| `PeriodEndMustBeAfterStartError` | `payment.invalid_period` | 400 | Period end must be after period start |
| `TransactionIdOrExternalIdRequiredError` | `payment.transaction_id_or_external_id_required` | 400 | Either transactionId or externalId required |

### Gateway Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `NoPaymentGatewayConfiguredError` | `payment.no_gateway_configured` | 500 | No payment gateway configured |
| `InvalidWebhookSignatureError` | `payment.invalid_webhook_signature` | 401 | Webhook signature verification failed |

### Payment Method Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `PaymentMethodAlreadySavedError` | `payment.method_already_saved` | 409 | Payment method already saved |
| `CustomerIdAndProviderMethodIdRequiredError` | `payment.customer_id_and_method_id_required` | 400 | Customer ID and provider method ID required |

### Domain Entity Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `RefundExceedsRefundableAmountError` | `payment.refund_exceeds_refundable` | 400 | Refund exceeds refundable amount (entity-level) |
| `InvalidPaymentTransitionError` | `payment.invalid_transition` | 400 | Invalid payment status transition |
| `InvalidStatusTransitionError` | `payment.invalid_transition` | 400 | Invalid status transition (entity-level) |
| `FraudCheckNotFoundError` | `payment.fraud_check_not_found` | 404 | Fraud check not found |

### Infrastructure Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `FailedToCreatePaymentWebhookError` | `payment.webhook_creation_failed` | 500 | Failed to create payment webhook record |
| `FailedToCreatePaymentDisputeError` | `payment.dispute_creation_failed` | 500 | Failed to create payment dispute |
| `FailedToCreatePaymentFeeError` | `payment.fee_creation_failed` | 500 | Failed to create payment fee |
| `FailedToCreateStoredPaymentMethodError` | `payment.stored_method_creation_failed` | 500 | Failed to create stored payment method |
| `FailedToRetrieveSavedPaymentMethodError` | `payment.stored_method_retrieval_failed` | 500 | Failed to retrieve saved payment method |
| `FailedToGenerateReportError` | `payment.report_generation_failed` | 500 | Failed to generate payment report |
| `FailedToCreatePayoutItemError` | `payment.payout_item_creation_failed` | 500 | Failed to create payout item |
| `FailedToCreatePayoutError` | `payment.payout_creation_failed` | 500 | Failed to create payout |
| `FailedToCreatePayoutSettingsError` | `payment.payout_settings_creation_failed` | 500 | Failed to create payout settings |
| `FailedToCreatePaymentGatewayError` | `payment.gateway_creation_failed` | 500 | Failed to create payment gateway |
| `PaymentGatewayNotFoundError` | `payment.gateway_not_found` | 404 | Payment gateway not found |
| `FailedToUpdatePaymentGatewayError` | `payment.gateway_update_failed` | 500 | Failed to update payment gateway |
| `FailedToCreatePaymentMethodConfigError` | `payment.method_config_creation_failed` | 500 | Failed to create payment method config |
| `PaymentMethodConfigNotFoundError` | `payment.method_config_not_found` | 404 | Payment method config not found |
| `FailedToUpdatePaymentMethodConfigError` | `payment.method_config_update_failed` | 500 | Failed to update payment method config |
| `FailedToCreatePaymentTransactionError` | `payment.transaction_creation_failed` | 500 | Failed to create payment transaction |
| `PaymentTransactionNotFoundError` | `payment.transaction_not_found` | 404 | Payment transaction not found (repo-level) |
| `FailedToUpdatePaymentTransactionError` | `payment.transaction_update_failed` | 500 | Failed to update payment transaction |
| `FailedToCreatePaymentRefundError` | `payment.refund_creation_failed` | 500 | Failed to create payment refund |
| `PaymentRefundNotFoundError` | `payment.refund_not_found` | 404 | Payment refund not found |
| `FailedToUpdatePaymentRefundError` | `payment.refund_update_failed` | 500 | Failed to update payment refund |
| `FailedToCreateSubscriptionInvoiceError` | `payment.subscription_invoice_creation_failed` | 500 | Failed to create subscription invoice |
| `PaymentMethodNotFoundError` | `payment.method_not_found` | 404 | Payment method not found by ID |
| `FailedToCreatePaymentMethodError` | `payment.method_creation_failed` | 500 | Failed to create payment method |
| `FailedToUpdatePaymentMethodError` | `payment.method_update_failed` | 500 | Failed to update payment method |
| `PaymentGatewayByIdNotFoundError` | `payment.gateway_not_found` | 404 | Payment gateway not found by ID |
| `FailedToUpdatePaymentGatewayByIdError` | `payment.gateway_update_failed` | 500 | Failed to update payment gateway by ID |
