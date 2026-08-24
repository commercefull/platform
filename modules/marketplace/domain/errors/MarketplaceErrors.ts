import { AppError } from '../../../../libs/errors';

export class VendorNotFoundError extends AppError {
  constructor(vendorId: string) {
    super(`Vendor not found: ${vendorId}`, 404, { code: 'VENDOR_NOT_FOUND', details: { vendorId } });
  }
}

export class VendorAlreadyExistsError extends AppError {
  constructor(name: string) {
    super(`Vendor already exists: ${name}`, 409, { code: 'VENDOR_ALREADY_EXISTS', details: { name } });
  }
}

export class VendorStatusError extends AppError {
  constructor(vendorId: string, action: string, currentStatus: string) {
    super(`Cannot ${action} vendor in status: ${currentStatus}`, 409, { code: 'VENDOR_STATUS_ERROR', details: { vendorId, action, currentStatus } });
  }
}

export class CommissionRuleNotFoundError extends AppError {
  constructor(ruleId: string) {
    super(`Commission rule not found: ${ruleId}`, 404, { code: 'COMMISSION_RULE_NOT_FOUND', details: { ruleId } });
  }
}

export class CommissionValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'COMMISSION_VALIDATION_ERROR' });
  }
}

export class PayoutNotFoundError extends AppError {
  constructor(payoutId: string) {
    super(`Payout not found: ${payoutId}`, 404, { code: 'PAYOUT_NOT_FOUND', details: { payoutId } });
  }
}

export class PayoutStatusError extends AppError {
  constructor(payoutId: string, action: string, currentStatus: string) {
    super(`Cannot ${action} payout in status: ${currentStatus}`, 409, { code: 'PAYOUT_STATUS_ERROR', details: { payoutId, action, currentStatus } });
  }
}

export class MarketplaceValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'MARKETPLACE_VALIDATION_ERROR' });
  }
}
