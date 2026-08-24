/**
 * Payment Domain Errors
 *
 * Typed errors for payment module operations.
 * All errors extend AppError with stable codes and appropriate status codes.
 */

import { AppError } from '../../../../libs/errors';

// ============================================================================
// Transaction Errors
// ============================================================================

export class TransactionNotFoundError extends AppError {
  constructor(transactionId: string) {
    super(`Transaction not found: ${transactionId}`, 404, { code: 'payment.transaction_not_found' });
  }
}

export class TransactionCannotBeCapturedError extends AppError {
  constructor(status: string) {
    super(`Transaction cannot be captured. Current status: ${status}`, 400, { code: 'payment.transaction_cannot_be_captured' });
  }
}

export class CaptureAmountExceedsAuthorizedError extends AppError {
  constructor() {
    super('Capture amount cannot exceed authorized amount', 400, { code: 'payment.capture_amount_exceeds_authorized' });
  }
}

export class CaptureFailedError extends AppError {
  constructor(error: string) {
    super(`Capture failed: ${error}`, 502, { code: 'payment.capture_failed' });
  }
}

export class TransactionCannotBeVoidedError extends AppError {
  constructor(status: string) {
    super(`Transaction cannot be voided. Current status: ${status}. Only authorized transactions can be voided.`, 400, { code: 'payment.transaction_cannot_be_voided' });
  }
}

export class VoidFailedError extends AppError {
  constructor(error: string) {
    super(`Void failed: ${error}`, 502, { code: 'payment.void_failed' });
  }
}

export class TransactionCannotBeRefundedError extends AppError {
  constructor(status: string) {
    super(`Transaction cannot be refunded. Status: ${status}`, 400, { code: 'payment.transaction_cannot_be_refunded' });
  }
}

export class RefundAmountExceedsRefundableError extends AppError {
  constructor(amount: number, refundable: number) {
    super(`Refund amount ($${amount}) exceeds refundable amount ($${refundable})`, 400, { code: 'payment.refund_amount_exceeds_refundable' });
  }
}

export class RefundAmountExceedsRefundableBalanceError extends AppError {
  constructor(balance: number) {
    super(`Refund amount exceeds refundable balance of ${balance}`, 400, { code: 'payment.refund_exceeds_balance' });
  }
}

export class MaxRetryAttemptsReachedError extends AppError {
  constructor() {
    super('Maximum retry attempts reached', 400, { code: 'payment.max_retry_attempts' });
  }
}

export class CannotRetryTransactionError extends AppError {
  constructor(status: string) {
    super(`Cannot retry transaction with status: ${status}`, 400, { code: 'payment.cannot_retry_transaction' });
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class AmountMustBePositiveError extends AppError {
  constructor() {
    super('Amount must be greater than zero', 400, { code: 'payment.amount_must_be_positive' });
  }
}

export class RefundAmountMustBePositiveError extends AppError {
  constructor() {
    super('Refund amount must be greater than zero', 400, { code: 'payment.refund_amount_must_be_positive' });
  }
}

export class PeriodEndMustBeAfterStartError extends AppError {
  constructor() {
    super('periodEnd must be after periodStart', 400, { code: 'payment.invalid_period' });
  }
}

export class TransactionIdOrExternalIdRequiredError extends AppError {
  constructor() {
    super('Either transactionId or externalId must be provided', 400, { code: 'payment.transaction_id_or_external_id_required' });
  }
}

// ============================================================================
// Gateway Errors
// ============================================================================

export class NoPaymentGatewayConfiguredError extends AppError {
  constructor() {
    super('No payment gateway configured', 500, { code: 'payment.no_gateway_configured' });
  }
}

export class InvalidWebhookSignatureError extends AppError {
  constructor() {
    super('Invalid webhook signature', 401, { code: 'payment.invalid_webhook_signature' });
  }
}

// ============================================================================
// Payment Method Errors
// ============================================================================

export class PaymentMethodAlreadySavedError extends AppError {
  constructor() {
    super('Payment method already saved', 409, { code: 'payment.method_already_saved' });
  }
}

export class CustomerIdAndProviderMethodIdRequiredError extends AppError {
  constructor() {
    super('Customer ID and provider payment method ID are required', 400, { code: 'payment.customer_id_and_method_id_required' });
  }
}

// ============================================================================
// Infrastructure Errors
// ============================================================================

export class FailedToCreatePaymentWebhookError extends AppError {
  constructor() {
    super('Failed to create payment webhook record', 500, { code: 'payment.webhook_creation_failed' });
  }
}

export class FailedToCreatePaymentDisputeError extends AppError {
  constructor() {
    super('Failed to create payment dispute', 500, { code: 'payment.dispute_creation_failed' });
  }
}

export class FailedToCreatePaymentFeeError extends AppError {
  constructor() {
    super('Failed to create payment fee', 500, { code: 'payment.fee_creation_failed' });
  }
}

export class FailedToCreateStoredPaymentMethodError extends AppError {
  constructor() {
    super('Failed to create stored payment method', 500, { code: 'payment.stored_method_creation_failed' });
  }
}

export class FailedToRetrieveSavedPaymentMethodError extends AppError {
  constructor() {
    super('Failed to retrieve saved payment method', 500, { code: 'payment.stored_method_retrieval_failed' });
  }
}

export class FailedToGenerateReportError extends AppError {
  constructor() {
    super('Failed to generate payment report', 500, { code: 'payment.report_generation_failed' });
  }
}

// ============================================================================
// Domain Entity Errors
// ============================================================================

export class RefundExceedsRefundableAmountError extends AppError {
  constructor() {
    super('Refund amount exceeds refundable amount', 400, { code: 'payment.refund_exceeds_refundable' });
  }
}

export class InvalidPaymentTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`Cannot transition payment from ${from} to ${to}`, 400, { code: 'payment.invalid_transition' });
  }
}

export class FraudCheckNotFoundError extends AppError {
  constructor() {
    super('Fraud check not found', 404, { code: 'payment.fraud_check_not_found' });
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(`Cannot transition payment from ${from} to ${to}`, 400, { code: 'payment.invalid_transition' });
  }
}

// ============================================================================
// Infrastructure Errors
// ============================================================================

export class FailedToCreatePayoutItemError extends AppError {
  constructor() {
    super('Failed to create payout item', 500, { code: 'payment.payout_item_creation_failed' });
  }
}

export class FailedToCreatePayoutError extends AppError {
  constructor() {
    super('Failed to create payout', 500, { code: 'payment.payout_creation_failed' });
  }
}

export class FailedToCreatePayoutSettingsError extends AppError {
  constructor() {
    super('Failed to create payout settings', 500, { code: 'payment.payout_settings_creation_failed' });
  }
}

export class FailedToCreatePaymentGatewayError extends AppError {
  constructor() {
    super('Failed to create payment gateway', 500, { code: 'payment.gateway_creation_failed' });
  }
}

export class PaymentGatewayNotFoundError extends AppError {
  constructor() {
    super('Payment gateway not found', 404, { code: 'payment.gateway_not_found' });
  }
}

export class FailedToUpdatePaymentGatewayError extends AppError {
  constructor() {
    super('Failed to update payment gateway', 500, { code: 'payment.gateway_update_failed' });
  }
}

export class FailedToCreatePaymentMethodConfigError extends AppError {
  constructor() {
    super('Failed to create payment method configuration', 500, { code: 'payment.method_config_creation_failed' });
  }
}

export class PaymentMethodConfigNotFoundError extends AppError {
  constructor() {
    super('Payment method configuration not found', 404, { code: 'payment.method_config_not_found' });
  }
}

export class FailedToUpdatePaymentMethodConfigError extends AppError {
  constructor() {
    super('Failed to update payment method configuration', 500, { code: 'payment.method_config_update_failed' });
  }
}

export class FailedToCreatePaymentTransactionError extends AppError {
  constructor() {
    super('Failed to create payment transaction', 500, { code: 'payment.transaction_creation_failed' });
  }
}

export class PaymentTransactionNotFoundError extends AppError {
  constructor() {
    super('Payment transaction not found', 404, { code: 'payment.transaction_not_found' });
  }
}

export class FailedToUpdatePaymentTransactionError extends AppError {
  constructor() {
    super('Failed to update payment transaction', 500, { code: 'payment.transaction_update_failed' });
  }
}

export class FailedToCreatePaymentRefundError extends AppError {
  constructor() {
    super('Failed to create payment refund', 500, { code: 'payment.refund_creation_failed' });
  }
}

export class PaymentRefundNotFoundError extends AppError {
  constructor() {
    super('Payment refund not found', 404, { code: 'payment.refund_not_found' });
  }
}

export class FailedToUpdatePaymentRefundError extends AppError {
  constructor() {
    super('Failed to update payment refund', 500, { code: 'payment.refund_update_failed' });
  }
}

export class FailedToCreateSubscriptionInvoiceError extends AppError {
  constructor() {
    super('Failed to create subscription invoice', 500, { code: 'payment.subscription_invoice_creation_failed' });
  }
}

export class PaymentMethodNotFoundError extends AppError {
  constructor(id: string) {
    super(`Payment method with ID ${id} not found`, 404, { code: 'payment.method_not_found' });
  }
}

export class FailedToCreatePaymentMethodError extends AppError {
  constructor() {
    super('Failed to create payment method', 500, { code: 'payment.method_creation_failed' });
  }
}

export class FailedToUpdatePaymentMethodError extends AppError {
  constructor(id: string) {
    super(`Failed to update payment method with ID ${id}`, 500, { code: 'payment.method_update_failed' });
  }
}

export class PaymentGatewayByIdNotFoundError extends AppError {
  constructor(id: string) {
    super(`Payment gateway with ID ${id} not found`, 404, { code: 'payment.gateway_not_found' });
  }
}

export class FailedToUpdatePaymentGatewayByIdError extends AppError {
  constructor(id: string) {
    super(`Failed to update payment gateway with ID ${id}`, 500, { code: 'payment.gateway_update_failed' });
  }
}

// ============================================================================
// PSP Routing / Failover Errors
// ============================================================================

export class AllProvidersExhaustedError extends AppError {
  constructor() {
    super('All payment providers exhausted', 502, { code: 'payment.all_providers_exhausted' });
  }
}

export class NoProvidersAvailableError extends AppError {
  constructor() {
    super('No payment providers available (all circuit breakers tripped)', 503, { code: 'payment.no_providers_available' });
  }
}

export class ProviderNotSupportedError extends AppError {
  constructor(provider: string) {
    super(`Payment provider '${provider}' is not supported`, 400, { code: 'payment.provider_not_supported' });
  }
}

export class CurrencyNotSupportedByProviderError extends AppError {
  constructor(currency: string, provider: string) {
    super(`Currency '${currency}' is not supported by provider '${provider}'`, 400, { code: 'payment.currency_not_supported_by_provider' });
  }
}

export class PaymentValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'payment.validation_error' });
  }
}
