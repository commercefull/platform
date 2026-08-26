export class IntegrationNotFoundError extends Error {
  statusCode = 404;
  code = 'INTEGRATION_NOT_FOUND';
  constructor(integrationId: string) {
    super(`Integration not found: ${integrationId}`);
    this.name = 'IntegrationNotFoundError';
  }
}

export class IntegrationAlreadyExistsError extends Error {
  statusCode = 409;
  code = 'INTEGRATION_ALREADY_EXISTS';
  constructor(name: string) {
    super(`Integration with name "${name}" already exists`);
    this.name = 'IntegrationAlreadyExistsError';
  }
}

export class CredentialNotFoundError extends Error {
  statusCode = 404;
  code = 'CREDENTIAL_NOT_FOUND';
  constructor(credentialId: string) {
    super(`Credential not found: ${credentialId}`);
    this.name = 'CredentialNotFoundError';
  }
}

export class SubscriptionNotFoundError extends Error {
  statusCode = 404;
  code = 'SUBSCRIPTION_NOT_FOUND';
  constructor(subscriptionId: string) {
    super(`Event subscription not found: ${subscriptionId}`);
    this.name = 'SubscriptionNotFoundError';
  }
}

export class IntegrationError extends Error {
  statusCode = 500;
  code = 'INTEGRATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'IntegrationError';
  }
}

export class CredentialEncryptionError extends Error {
  statusCode = 500;
  code = 'CREDENTIAL_ENCRYPTION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'CredentialEncryptionError';
  }
}
