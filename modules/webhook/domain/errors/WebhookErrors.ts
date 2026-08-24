import { AppError } from '../../../../libs/errors';

export class WebhookNotFoundError extends AppError {
  constructor(webhookId: string) {
    super(`Webhook not found: ${webhookId}`, 404, { code: 'webhook.not_found' });
  }
}

export class WebhookEndpointNotFoundError extends AppError {
  constructor(endpointId: string) {
    super(`Webhook endpoint not found: ${endpointId}`, 404, { code: 'webhook.endpoint_not_found' });
  }
}

export class WebhookDeliveryNotFoundError extends AppError {
  constructor(deliveryId: string) {
    super(`Webhook delivery not found: ${deliveryId}`, 404, { code: 'webhook.delivery_not_found' });
  }
}

export class WebhookEndpointAlreadyExistsError extends AppError {
  constructor(url: string) {
    super(`Webhook endpoint already exists: ${url}`, 409, { code: 'webhook.endpoint_already_exists' });
  }
}

export class InvalidWebhookUrlError extends AppError {
  constructor(url: string) {
    super(`Invalid webhook URL: ${url}`, 400, { code: 'webhook.invalid_url' });
  }
}

export class FailedToDeliverWebhookError extends AppError {
  constructor(reason: string) {
    super(`Failed to deliver webhook: ${reason}`, 500, { code: 'webhook.delivery_failed' });
  }
}

export class WebhookValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'webhook.validation_error' });
  }
}

export class FailedToCreateWebhookEndpointError extends AppError {
  constructor() {
    super('Failed to create webhook endpoint', 500, { code: 'webhook.endpoint_creation_failed' });
  }
}

export class FailedToCreateWebhookDeliveryError extends AppError {
  constructor() {
    super('Failed to create webhook delivery', 500, { code: 'webhook.delivery_creation_failed' });
  }
}
