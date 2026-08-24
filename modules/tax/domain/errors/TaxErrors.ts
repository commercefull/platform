import { AppError } from '../../../../libs/errors';

export class TaxClassNotFoundError extends AppError {
  constructor(classId: string) {
    super(`Tax class not found: ${classId}`, 404, { code: 'tax.class_not_found' });
  }
}

export class TaxRateNotFoundError extends AppError {
  constructor(rateId: string) {
    super(`Tax rate not found: ${rateId}`, 404, { code: 'tax.rate_not_found' });
  }
}

export class TaxRateAlreadyExistsError extends AppError {
  constructor(zone: string, classId: string) {
    super(`Tax rate already exists for zone ${zone} and class ${classId}`, 409, { code: 'tax.rate_already_exists' });
  }
}

export class TaxZoneNotFoundError extends AppError {
  constructor(zoneId: string) {
    super(`Tax zone not found: ${zoneId}`, 404, { code: 'tax.zone_not_found' });
  }
}

export class InvalidTaxRateError extends AppError {
  constructor(rate: number) {
    super(`Invalid tax rate: ${rate}. Must be between 0 and 100`, 400, { code: 'tax.invalid_rate' });
  }
}

export class FailedToCalculateTaxError extends AppError {
  constructor(reason: string) {
    super(`Failed to calculate tax: ${reason}`, 500, { code: 'tax.calculation_failed' });
  }
}

export class TaxValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'tax.validation_error' });
  }
}

export class FailedToCreateTaxError extends AppError {
  constructor(message: string = 'Failed to create tax entity') {
    super(message, 500, { code: 'tax.creation_failed' });
  }
}

export class TaxCategoryNotFoundError extends AppError {
  constructor(categoryId: string) {
    super(`Tax category not found: ${categoryId}`, 404, { code: 'tax.category_not_found' });
  }
}

export class TaxExemptionNotFoundError extends AppError {
  constructor(exemptionId: string) {
    super(`Tax exemption not found: ${exemptionId}`, 404, { code: 'tax.exemption_not_found' });
  }
}

export class TaxSettingsNotFoundError extends AppError {
  constructor(settingsId: string) {
    super(`Tax settings not found: ${settingsId}`, 404, { code: 'tax.settings_not_found' });
  }
}
