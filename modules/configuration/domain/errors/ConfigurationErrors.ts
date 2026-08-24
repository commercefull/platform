import { AppError } from '../../../../libs/errors';

export class ConfigurationNotFoundError extends AppError {
  constructor(key: string) {
    super(`Configuration not found: ${key}`, 404, { code: 'configuration.not_found' });
  }
}

export class InvalidConfigurationValueError extends AppError {
  constructor(key: string, reason: string) {
    super(`Invalid value for configuration ${key}: ${reason}`, 400, { code: 'configuration.invalid_value' });
  }
}

export class ConfigurationKeyRequiredError extends AppError {
  constructor() {
    super('Configuration key is required', 400, { code: 'configuration.key_required' });
  }
}

export class ConfigurationValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'configuration.validation_error' });
  }
}
