import {
  TransactionNotFoundError, TransactionCannotBeCapturedError, CaptureAmountExceedsAuthorizedError,
  CaptureFailedError, TransactionCannotBeVoidedError, VoidFailedError, TransactionCannotBeRefundedError,
  RefundAmountExceedsRefundableError, RefundAmountExceedsRefundableBalanceError, MaxRetryAttemptsReachedError,
  CannotRetryTransactionError, AmountMustBePositiveError, RefundAmountMustBePositiveError,
  PeriodEndMustBeAfterStartError, TransactionIdOrExternalIdRequiredError, NoPaymentGatewayConfiguredError,
  InvalidWebhookSignatureError, PaymentMethodAlreadySavedError, CustomerIdAndProviderMethodIdRequiredError,
  FailedToCreatePaymentWebhookError, FailedToCreatePaymentDisputeError, FailedToCreatePaymentFeeError,
  FailedToCreateStoredPaymentMethodError, FailedToRetrieveSavedPaymentMethodError,
  FailedToGenerateReportError, RefundExceedsRefundableAmountError, InvalidPaymentTransitionError,
  FraudCheckNotFoundError, InvalidStatusTransitionError, FailedToCreatePayoutItemError,
  FailedToCreatePayoutError, FailedToCreatePayoutSettingsError, FailedToCreatePaymentGatewayError,
  PaymentGatewayNotFoundError, FailedToUpdatePaymentGatewayError, FailedToCreatePaymentMethodConfigError,
  PaymentMethodConfigNotFoundError, FailedToUpdatePaymentMethodConfigError,
  FailedToCreatePaymentTransactionError, PaymentTransactionNotFoundError, FailedToUpdatePaymentTransactionError,
  FailedToCreatePaymentRefundError, PaymentRefundNotFoundError, FailedToUpdatePaymentRefundError,
  FailedToCreateSubscriptionInvoiceError, PaymentMethodNotFoundError, FailedToCreatePaymentMethodError,
  FailedToUpdatePaymentMethodError, PaymentGatewayByIdNotFoundError, FailedToUpdatePaymentGatewayByIdError,
} from './PaymentErrors';

describe('PaymentErrors', () => {
  it('TransactionNotFoundError', () => { expect(new TransactionNotFoundError('t1').statusCode).toBe(404); });
  it('TransactionCannotBeCapturedError', () => { expect(new TransactionCannotBeCapturedError('bad').statusCode).toBe(400); });
  it('CaptureAmountExceedsAuthorizedError', () => { expect(new CaptureAmountExceedsAuthorizedError().statusCode).toBe(400); });
  it('CaptureFailedError', () => { expect(new CaptureFailedError('err').statusCode).toBe(502); });
  it('TransactionCannotBeVoidedError', () => { expect(new TransactionCannotBeVoidedError('bad').statusCode).toBe(400); });
  it('VoidFailedError', () => { expect(new VoidFailedError('err').statusCode).toBe(502); });
  it('TransactionCannotBeRefundedError', () => { expect(new TransactionCannotBeRefundedError('bad').statusCode).toBe(400); });
  it('RefundAmountExceedsRefundableError', () => { expect(new RefundAmountExceedsRefundableError(100, 50).statusCode).toBe(400); });
  it('RefundAmountExceedsRefundableBalanceError', () => { expect(new RefundAmountExceedsRefundableBalanceError(100).statusCode).toBe(400); });
  it('MaxRetryAttemptsReachedError', () => { expect(new MaxRetryAttemptsReachedError().statusCode).toBe(400); });
  it('CannotRetryTransactionError', () => { expect(new CannotRetryTransactionError('bad').statusCode).toBe(400); });
  it('AmountMustBePositiveError', () => { expect(new AmountMustBePositiveError().statusCode).toBe(400); });
  it('RefundAmountMustBePositiveError', () => { expect(new RefundAmountMustBePositiveError().statusCode).toBe(400); });
  it('PeriodEndMustBeAfterStartError', () => { expect(new PeriodEndMustBeAfterStartError().statusCode).toBe(400); });
  it('TransactionIdOrExternalIdRequiredError', () => { expect(new TransactionIdOrExternalIdRequiredError().statusCode).toBe(400); });
  it('NoPaymentGatewayConfiguredError', () => { expect(new NoPaymentGatewayConfiguredError().statusCode).toBe(500); });
  it('InvalidWebhookSignatureError', () => { expect(new InvalidWebhookSignatureError().statusCode).toBe(401); });
  it('PaymentMethodAlreadySavedError', () => { expect(new PaymentMethodAlreadySavedError().statusCode).toBe(409); });
  it('CustomerIdAndProviderMethodIdRequiredError', () => { expect(new CustomerIdAndProviderMethodIdRequiredError().statusCode).toBe(400); });
  it('FailedToCreatePaymentWebhookError', () => { expect(new FailedToCreatePaymentWebhookError().statusCode).toBe(500); });
  it('FailedToCreatePaymentDisputeError', () => { expect(new FailedToCreatePaymentDisputeError().statusCode).toBe(500); });
  it('FailedToCreatePaymentFeeError', () => { expect(new FailedToCreatePaymentFeeError().statusCode).toBe(500); });
  it('FailedToCreateStoredPaymentMethodError', () => { expect(new FailedToCreateStoredPaymentMethodError().statusCode).toBe(500); });
  it('FailedToRetrieveSavedPaymentMethodError', () => { expect(new FailedToRetrieveSavedPaymentMethodError().statusCode).toBe(500); });
  it('FailedToGenerateReportError', () => { expect(new FailedToGenerateReportError().statusCode).toBe(500); });
  it('RefundExceedsRefundableAmountError', () => { expect(new RefundExceedsRefundableAmountError().statusCode).toBe(400); });
  it('InvalidPaymentTransitionError', () => { expect(new InvalidPaymentTransitionError('a', 'b').statusCode).toBe(400); });
  it('FraudCheckNotFoundError', () => { expect(new FraudCheckNotFoundError().statusCode).toBe(404); });
  it('InvalidStatusTransitionError', () => { expect(new InvalidStatusTransitionError('a', 'b').statusCode).toBe(400); });
  it('FailedToCreatePayoutItemError', () => { expect(new FailedToCreatePayoutItemError().statusCode).toBe(500); });
  it('FailedToCreatePayoutError', () => { expect(new FailedToCreatePayoutError().statusCode).toBe(500); });
  it('FailedToCreatePayoutSettingsError', () => { expect(new FailedToCreatePayoutSettingsError().statusCode).toBe(500); });
  it('FailedToCreatePaymentGatewayError', () => { expect(new FailedToCreatePaymentGatewayError().statusCode).toBe(500); });
  it('PaymentGatewayNotFoundError', () => { expect(new PaymentGatewayNotFoundError().statusCode).toBe(404); });
  it('FailedToUpdatePaymentGatewayError', () => { expect(new FailedToUpdatePaymentGatewayError().statusCode).toBe(500); });
  it('FailedToCreatePaymentMethodConfigError', () => { expect(new FailedToCreatePaymentMethodConfigError().statusCode).toBe(500); });
  it('PaymentMethodConfigNotFoundError', () => { expect(new PaymentMethodConfigNotFoundError().statusCode).toBe(404); });
  it('FailedToUpdatePaymentMethodConfigError', () => { expect(new FailedToUpdatePaymentMethodConfigError().statusCode).toBe(500); });
  it('FailedToCreatePaymentTransactionError', () => { expect(new FailedToCreatePaymentTransactionError().statusCode).toBe(500); });
  it('PaymentTransactionNotFoundError', () => { expect(new PaymentTransactionNotFoundError().statusCode).toBe(404); });
  it('FailedToUpdatePaymentTransactionError', () => { expect(new FailedToUpdatePaymentTransactionError().statusCode).toBe(500); });
  it('FailedToCreatePaymentRefundError', () => { expect(new FailedToCreatePaymentRefundError().statusCode).toBe(500); });
  it('PaymentRefundNotFoundError', () => { expect(new PaymentRefundNotFoundError().statusCode).toBe(404); });
  it('FailedToUpdatePaymentRefundError', () => { expect(new FailedToUpdatePaymentRefundError().statusCode).toBe(500); });
  it('FailedToCreateSubscriptionInvoiceError', () => { expect(new FailedToCreateSubscriptionInvoiceError().statusCode).toBe(500); });
  it('PaymentMethodNotFoundError', () => { expect(new PaymentMethodNotFoundError('m1').statusCode).toBe(404); });
  it('FailedToCreatePaymentMethodError', () => { expect(new FailedToCreatePaymentMethodError().statusCode).toBe(500); });
  it('FailedToUpdatePaymentMethodError', () => { expect(new FailedToUpdatePaymentMethodError('m1').statusCode).toBe(500); });
  it('PaymentGatewayByIdNotFoundError', () => { expect(new PaymentGatewayByIdNotFoundError('g1').statusCode).toBe(404); });
  it('FailedToUpdatePaymentGatewayByIdError', () => { expect(new FailedToUpdatePaymentGatewayByIdError('g1').statusCode).toBe(500); });
});
