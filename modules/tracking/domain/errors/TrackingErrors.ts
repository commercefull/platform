import { AppError } from '../../../../libs/errors';

export class TrackingError extends AppError {
  constructor(message: string, statusCode = 500, code = 'tracking_error') {
    super(message, statusCode, { code });
  }
}

export class TrackingValidationError extends TrackingError {
  constructor(message: string) {
    super(message, 400, 'tracking.validation_error');
    this.name = 'TrackingValidationError';
  }
}

export class TrackingConfigNotFoundError extends TrackingError {
  constructor(identifier: string) {
    super(`Tracking config not found: ${identifier}`, 404, 'tracking.config_not_found');
    this.name = 'TrackingConfigNotFoundError';
  }
}

export class TrackingConfigAlreadyExistsError extends TrackingError {
  constructor(storeId: string) {
    super(`Tracking config already exists for store: ${storeId}`, 409, 'tracking.config_already_exists');
    this.name = 'TrackingConfigAlreadyExistsError';
  }
}

export class TrackingProviderError extends TrackingError {
  constructor(provider: string, message: string) {
    super(`Tracking provider '${provider}' error: ${message}`, 500, 'tracking.provider_error');
    this.name = 'TrackingProviderError';
  }
}

export class TrackingConsentNotGrantedError extends TrackingError {
  constructor(event: string, category: string) {
    super(`Consent not granted for event '${event}' (category: ${category})`, 400, 'tracking.consent_not_granted');
    this.name = 'TrackingConsentNotGrantedError';
  }
}

export class TrackingEventNotMappedError extends TrackingError {
  constructor(sourceEvent: string) {
    super(`No tracking mapping found for event: ${sourceEvent}`, 400, 'tracking.event_not_mapped');
    this.name = 'TrackingEventNotMappedError';
  }
}
