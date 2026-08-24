import {
  WebhookNotFoundError,
  WebhookEndpointNotFoundError,
  WebhookDeliveryNotFoundError,
  WebhookEndpointAlreadyExistsError,
  InvalidWebhookUrlError,
  FailedToDeliverWebhookError,
  WebhookValidationError,
  FailedToCreateWebhookEndpointError,
  FailedToCreateWebhookDeliveryError,
} from './WebhookErrors';

describe('WebhookErrors', () => {
  it('WebhookNotFoundError', () => {
    const err = new WebhookNotFoundError('w1');
    expect(err.message).toContain('w1');
    expect(err.statusCode).toBe(404);
  });

  it('WebhookEndpointNotFoundError', () => {
    const err = new WebhookEndpointNotFoundError('we1');
    expect(err.message).toContain('we1');
    expect(err.statusCode).toBe(404);
  });

  it('WebhookDeliveryNotFoundError', () => {
    const err = new WebhookDeliveryNotFoundError('d1');
    expect(err.message).toContain('d1');
    expect(err.statusCode).toBe(404);
  });

  it('WebhookEndpointAlreadyExistsError', () => {
    const err = new WebhookEndpointAlreadyExistsError('https://example.com');
    expect(err.message).toContain('already exists');
    expect(err.statusCode).toBe(409);
  });

  it('InvalidWebhookUrlError', () => {
    const err = new InvalidWebhookUrlError('bad-url');
    expect(err.message).toContain('Invalid webhook URL');
    expect(err.statusCode).toBe(400);
  });

  it('FailedToDeliverWebhookError', () => {
    const err = new FailedToDeliverWebhookError('timeout');
    expect(err.message).toContain('Failed to deliver');
    expect(err.statusCode).toBe(500);
  });

  it('WebhookValidationError', () => {
    const err = new WebhookValidationError('bad input');
    expect(err.message).toBe('bad input');
    expect(err.statusCode).toBe(400);
  });

  it('FailedToCreateWebhookEndpointError', () => {
    const err = new FailedToCreateWebhookEndpointError();
    expect(err.statusCode).toBe(500);
  });

  it('FailedToCreateWebhookDeliveryError', () => {
    const err = new FailedToCreateWebhookDeliveryError();
    expect(err.statusCode).toBe(500);
  });
});
