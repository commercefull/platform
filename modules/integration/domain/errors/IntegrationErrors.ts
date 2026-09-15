import { AppError } from '../../../../libs/errors';

export class IntegrationNotFoundError extends AppError {
  constructor(integrationId: string) {
    super(`Integration not found: ${integrationId}`, 404, { code: 'INTEGRATION_NOT_FOUND' });
    this.name = 'IntegrationNotFoundError';
  }
}

export class IntegrationAlreadyExistsError extends AppError {
  constructor(name: string) {
    super(`Integration with name "${name}" already exists`, 409, { code: 'INTEGRATION_ALREADY_EXISTS' });
    this.name = 'IntegrationAlreadyExistsError';
  }
}

export class CredentialNotFoundError extends AppError {
  constructor(credentialId: string) {
    super(`Credential not found: ${credentialId}`, 404, { code: 'CREDENTIAL_NOT_FOUND' });
    this.name = 'CredentialNotFoundError';
  }
}

export class SubscriptionNotFoundError extends AppError {
  constructor(subscriptionId: string) {
    super(`Event subscription not found: ${subscriptionId}`, 404, { code: 'SUBSCRIPTION_NOT_FOUND' });
    this.name = 'SubscriptionNotFoundError';
  }
}

export class IntegrationError extends AppError {
  constructor(message: string) {
    super(message, 500, { code: 'INTEGRATION_ERROR' });
    this.name = 'IntegrationError';
  }
}

export class CredentialEncryptionError extends AppError {
  constructor(message: string) {
    super(message, 500, { code: 'CREDENTIAL_ENCRYPTION_ERROR' });
    this.name = 'CredentialEncryptionError';
  }
}
