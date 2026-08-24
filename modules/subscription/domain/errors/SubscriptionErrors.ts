import { AppError } from '../../../../libs/errors';

export class SubscriptionNotFoundError extends AppError {
  constructor(subscriptionId: string) {
    super(`Subscription not found: ${subscriptionId}`, 404, { code: 'subscription.not_found' });
  }
}

export class SubscriptionPlanNotFoundError extends AppError {
  constructor(planId: string) {
    super(`Subscription plan not found: ${planId}`, 404, { code: 'subscription.plan_not_found' });
  }
}

export class SubscriptionNotActiveError extends AppError {
  constructor(subscriptionId: string) {
    super(`Subscription ${subscriptionId} is not active`, 400, { code: 'subscription.not_active' });
  }
}

export class SubscriptionAlreadyPausedError extends AppError {
  constructor(subscriptionId: string) {
    super(`Subscription ${subscriptionId} is already paused`, 400, { code: 'subscription.already_paused' });
  }
}

export class SubscriptionNotPausedError extends AppError {
  constructor(subscriptionId: string) {
    super(`Subscription ${subscriptionId} is not paused`, 400, { code: 'subscription.not_paused' });
  }
}

export class SubscriptionCannotBeCancelledError extends AppError {
  constructor(status: string) {
    super(`Subscription cannot be cancelled in status: ${status}`, 400, { code: 'subscription.cannot_be_cancelled' });
  }
}

export class SubscriptionInvoiceNotFoundError extends AppError {
  constructor(invoiceId: string) {
    super(`Subscription invoice not found: ${invoiceId}`, 404, { code: 'subscription.invoice_not_found' });
  }
}

export class FailedToRenewSubscriptionError extends AppError {
  constructor() {
    super('Failed to renew subscription', 500, { code: 'subscription.renewal_failed' });
  }
}

export class FailedToProcessRenewalError extends AppError {
  constructor() {
    super('Failed to process subscription renewal', 500, { code: 'subscription.process_renewal_failed' });
  }
}

export class SubscriptionValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'subscription.validation_error' });
  }
}
