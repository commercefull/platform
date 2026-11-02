import { WebhookDeliveryEntity } from './WebhookDelivery';

describe('WebhookDeliveryEntity', () => {
  it('should create a delivery (happy path)', () => {
    const d = WebhookDeliveryEntity.create({
      webhookDeliveryId: 'd1',
      webhookEndpointId: 'we1',
      eventType: 'product.created',
      eventId: 'e1',
      payload: { id: 1 },
    });
    expect(d.webhookDeliveryId).toBe('d1');
    expect(d.status).toBe('pending');
    expect(d.attempts).toBe(0);
  });

  it('should record success', () => {
    const d = WebhookDeliveryEntity.create({
      webhookDeliveryId: 'd1',
      webhookEndpointId: 'we1',
      eventType: 'test',
      eventId: 'e1',
      payload: {},
    });
    d.recordSuccess(200, 'OK', 50);
    expect(d.status).toBe('success');
    expect(d.attempts).toBe(1);
    expect(d.responseStatus).toBe(200);
    expect(d.duration).toBe(50);
    expect(d.nextRetryAt).toBeNull();
  });

  it('should record failure with retry', () => {
    const d = WebhookDeliveryEntity.create({
      webhookDeliveryId: 'd1',
      webhookEndpointId: 'we1',
      eventType: 'test',
      eventId: 'e1',
      payload: {},
    });
    d.recordFailure({
      errorMessage: 'Timeout',
      responseStatus: 500,
      responseBody: 'Server Error',
      durationMs: 100,
      maxRetries: 5,
      retryIntervalMs: 1000,
      backoffMultiplier: 2,
    });
    expect(d.status).toBe('retrying');
    expect(d.attempts).toBe(1);
    expect(d.errorMessage).toBe('Timeout');
    expect(d.nextRetryAt).toBeDefined();
  });

  it('should mark as failed after max retries', () => {
    const d = WebhookDeliveryEntity.create({
      webhookDeliveryId: 'd1',
      webhookEndpointId: 'we1',
      eventType: 'test',
      eventId: 'e1',
      payload: {},
    });
    for (let i = 0; i < 5; i++) {
      d.recordFailure({
        errorMessage: 'Error',
        responseStatus: 500,
        responseBody: null,
        durationMs: 50,
        maxRetries: 5,
        retryIntervalMs: 100,
        backoffMultiplier: 2,
      });
    }
    expect(d.status).toBe('failed');
    expect(d.nextRetryAt).toBeNull();
  });

  it('should truncate response body to 4096 chars', () => {
    const d = WebhookDeliveryEntity.create({
      webhookDeliveryId: 'd1',
      webhookEndpointId: 'we1',
      eventType: 'test',
      eventId: 'e1',
      payload: {},
    });
    const longBody = 'x'.repeat(5000);
    d.recordSuccess(200, longBody, 10);
    expect(d.responseBody!.length).toBe(4096);
  });

  it('should serialize to JSON', () => {
    const d = WebhookDeliveryEntity.create({
      webhookDeliveryId: 'd1',
      webhookEndpointId: 'we1',
      eventType: 'test',
      eventId: 'e1',
      payload: { a: 1 },
    });
    const json = d.toJSON();
    expect(json.webhookDeliveryId).toBe('d1');
    expect(json.status).toBe('pending');
  });
});
