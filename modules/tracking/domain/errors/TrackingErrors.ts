export class TrackingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrackingError';
  }
}

export class TrackingValidationError extends TrackingError {
  constructor(message: string) {
    super(message);
    this.name = 'TrackingValidationError';
  }
}

export class TrackingConfigNotFoundError extends TrackingError {
  constructor(identifier: string) {
    super(`Tracking config not found: ${identifier}`);
    this.name = 'TrackingConfigNotFoundError';
  }
}

export class TrackingConfigAlreadyExistsError extends TrackingError {
  constructor(storeId: string) {
    super(`Tracking config already exists for store: ${storeId}`);
    this.name = 'TrackingConfigAlreadyExistsError';
  }
}

export class TrackingProviderError extends TrackingError {
  constructor(provider: string, message: string) {
    super(`Tracking provider '${provider}' error: ${message}`);
    this.name = 'TrackingProviderError';
  }
}

export class TrackingConsentNotGrantedError extends TrackingError {
  constructor(event: string, category: string) {
    super(`Consent not granted for event '${event}' (category: ${category})`);
    this.name = 'TrackingConsentNotGrantedError';
  }
}

export class TrackingEventNotMappedError extends TrackingError {
  constructor(sourceEvent: string) {
    super(`No tracking mapping found for event: ${sourceEvent}`);
    this.name = 'TrackingEventNotMappedError';
  }
}
