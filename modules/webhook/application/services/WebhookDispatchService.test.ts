jest.mock('../../../../libs/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../../libs/uuid', () => ({
  generateUUID: jest.fn().mockReturnValue('delivery-uuid-1'),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: {
    on: jest.fn(),
    emit: jest.fn().mockResolvedValue(undefined),
  },
}));

import { WebhookDispatchService } from './WebhookDispatchService';
import { eventBus } from '../../../../libs/events/eventBus';

const endpointProps = {
  webhookEndpointId: 'we1', organizationId: null, name: 'Hook', url: 'https://example.com/hook',
  secret: 's3cr3t', events: ['*'], isActive: true, headers: null,
  retryPolicy: { maxRetries: 3, retryIntervalMs: 1000, backoffMultiplier: 2 },
  createdAt: new Date(), updatedAt: new Date(),
};

const deliveryProps = {
  webhookDeliveryId: 'd1', webhookEndpointId: 'we1', eventType: 'test', eventId: 'e1',
  payload: {}, status: 'retrying' as const, attempts: 1, lastAttemptAt: new Date(), nextRetryAt: new Date(),
  responseStatus: 500, responseBody: null, errorMessage: 'err', duration: 100,
  createdAt: new Date(), updatedAt: new Date(),
};

const mockRepo = {
  findEndpointsByEvent: jest.fn().mockResolvedValue([]),
  createDelivery: jest.fn().mockResolvedValue(undefined),
  updateDelivery: jest.fn().mockResolvedValue(undefined),
  findPendingRetries: jest.fn().mockResolvedValue([]),
  claimPendingRetries: jest.fn().mockResolvedValue([]),
  releaseDeliveryLock: jest.fn().mockResolvedValue(undefined),
  findEndpointById: jest.fn().mockResolvedValue(null),
};

describe('WebhookDispatchService', () => {
  let service: WebhookDispatchService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.findEndpointsByEvent.mockResolvedValue([]);
    mockRepo.findPendingRetries.mockResolvedValue([]);
    mockRepo.claimPendingRetries.mockResolvedValue([]);
    mockRepo.releaseDeliveryLock.mockResolvedValue(undefined);
    mockRepo.findEndpointById.mockResolvedValue(null);
    mockRepo.createDelivery.mockResolvedValue(undefined);
    mockRepo.updateDelivery.mockResolvedValue(undefined);
    service = new WebhookDispatchService(mockRepo as never);
  });

  afterEach(() => {
    service.stop();
  });

  it('should start and stop without errors', () => {
    expect(() => service.start()).not.toThrow();
    expect(() => service.stop()).not.toThrow();
  });

  it('should register eventBus listener on start', () => {
    service.start();
    expect(eventBus.on).toHaveBeenCalledWith('*', expect.any(Function));
  });

  it('should handle events with no matching endpoints', async () => {
    mockRepo.findEndpointsByEvent.mockResolvedValueOnce([]);
    const handleEvent = (service as unknown as { handleEvent: (p: unknown) => Promise<void> }).handleEvent.bind(service);
    await expect(handleEvent({ type: 'test.event', data: {}, timestamp: new Date(), correlationId: 'c1' })).resolves.toBeUndefined();
    expect(mockRepo.createDelivery).not.toHaveBeenCalled();
  });

  it('should skip inactive endpoints', async () => {
    mockRepo.findEndpointsByEvent.mockResolvedValueOnce([{ ...endpointProps, isActive: false }]);
    const handleEvent = (service as unknown as { handleEvent: (p: unknown) => Promise<void> }).handleEvent.bind(service);
    await handleEvent({ type: 'test.event', data: {}, timestamp: new Date(), correlationId: 'c1' });
    await new Promise(r => setTimeout(r, 50));
    expect(mockRepo.createDelivery).not.toHaveBeenCalled();
  });

  it('should dispatch to active endpoints and record success', async () => {
    mockRepo.findEndpointsByEvent.mockResolvedValueOnce([endpointProps]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200, text: jest.fn().mockResolvedValue('OK'),
    }) as never;

    const handleEvent = (service as unknown as { handleEvent: (p: unknown) => Promise<void> }).handleEvent.bind(service);
    await handleEvent({ type: 'test.event', data: { id: 1 }, timestamp: new Date(), correlationId: 'c1' });
    await new Promise(r => setTimeout(r, 100));

    expect(mockRepo.createDelivery).toHaveBeenCalled();
    expect(mockRepo.updateDelivery).toHaveBeenCalled();
    const updateCall = mockRepo.updateDelivery.mock.calls[0][1];
    expect(updateCall.status).toBe('success');
    expect(updateCall.responseStatus).toBe(200);
  });

  it('should record failure on non-2xx response', async () => {
    mockRepo.findEndpointsByEvent.mockResolvedValueOnce([endpointProps]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 500, text: jest.fn().mockResolvedValue('Server Error'),
    }) as never;

    const handleEvent = (service as unknown as { handleEvent: (p: unknown) => Promise<void> }).handleEvent.bind(service);
    await handleEvent({ type: 'test.event', data: {}, timestamp: new Date(), correlationId: 'c1' });
    await new Promise(r => setTimeout(r, 100));

    const updateCall = mockRepo.updateDelivery.mock.calls[0][1];
    expect(updateCall.status).toBe('retrying');
    expect(updateCall.errorMessage).toContain('HTTP 500');
  });

  it('should record failure on network error', async () => {
    mockRepo.findEndpointsByEvent.mockResolvedValueOnce([endpointProps]);
    global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout')) as never;

    const handleEvent = (service as unknown as { handleEvent: (p: unknown) => Promise<void> }).handleEvent.bind(service);
    await handleEvent({ type: 'test.event', data: {}, timestamp: new Date(), correlationId: 'c1' });
    await new Promise(r => setTimeout(r, 100));

    const updateCall = mockRepo.updateDelivery.mock.calls[0][1];
    expect(updateCall.status).toBe('retrying');
    expect(updateCall.errorMessage).toBe('Network timeout');
  });

  it('should include custom headers from endpoint', async () => {
    const epWithHeaders = { ...endpointProps, headers: { 'X-Custom': 'val' } };
    mockRepo.findEndpointsByEvent.mockResolvedValueOnce([epWithHeaders]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200, text: jest.fn().mockResolvedValue('OK'),
    }) as never;

    const handleEvent = (service as unknown as { handleEvent: (p: unknown) => Promise<void> }).handleEvent.bind(service);
    await handleEvent({ type: 'test.event', data: {}, timestamp: new Date(), correlationId: 'c1' });
    await new Promise(r => setTimeout(r, 100));

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].headers['X-Custom']).toBe('val');
    expect(fetchCall[1].headers['X-Webhook-Signature']).toBeDefined();
  });

  it('should handle errors in handleEvent gracefully', async () => {
    mockRepo.findEndpointsByEvent.mockRejectedValue(new Error('DB error'));
    const handleEvent = (service as unknown as { handleEvent: (p: unknown) => Promise<void> }).handleEvent.bind(service);
    await expect(handleEvent({ type: 'test.event', data: {}, timestamp: new Date(), correlationId: 'c1' })).resolves.toBeUndefined();
  });

  it('should mark delivery as failed when endpoint not found during retry', async () => {
    mockRepo.claimPendingRetries.mockResolvedValueOnce([deliveryProps]);
    mockRepo.findEndpointById.mockResolvedValue(null);

    const processRetries = (service as unknown as { processRetries: () => Promise<void> }).processRetries.bind(service);
    await processRetries();

    const failCall = mockRepo.updateDelivery.mock.calls.find(c => c[1].status === 'failed');
    expect(failCall).toBeDefined();
    expect(failCall![1].errorMessage).toBe('Endpoint no longer active');
    expect(mockRepo.releaseDeliveryLock).toHaveBeenCalledWith('d1');
  });

  it('should mark delivery as failed when endpoint inactive during retry', async () => {
    mockRepo.claimPendingRetries.mockResolvedValueOnce([deliveryProps]);
    mockRepo.findEndpointById.mockResolvedValue({ ...endpointProps, isActive: false });

    const processRetries = (service as unknown as { processRetries: () => Promise<void> }).processRetries.bind(service);
    await processRetries();

    const failCall = mockRepo.updateDelivery.mock.calls.find(c => c[1].status === 'failed');
    expect(failCall).toBeDefined();
    expect(mockRepo.releaseDeliveryLock).toHaveBeenCalledWith('d1');
  });

  it('should retry delivery when endpoint is active', async () => {
    mockRepo.claimPendingRetries.mockResolvedValueOnce([deliveryProps]);
    mockRepo.findEndpointById.mockResolvedValue(endpointProps);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200, text: jest.fn().mockResolvedValue('OK'),
    }) as never;

    const processRetries = (service as unknown as { processRetries: () => Promise<void> }).processRetries.bind(service);
    await processRetries();
    await new Promise(r => setTimeout(r, 100));

    const successCall = mockRepo.updateDelivery.mock.calls.find(c => c[1].status === 'success');
    expect(successCall).toBeDefined();
    expect(mockRepo.releaseDeliveryLock).toHaveBeenCalledWith('d1');
  });

  it('should do nothing when no pending retries', async () => {
    mockRepo.claimPendingRetries.mockResolvedValueOnce([]);
    const processRetries = (service as unknown as { processRetries: () => Promise<void> }).processRetries.bind(service);
    await processRetries();
    expect(mockRepo.updateDelivery).not.toHaveBeenCalled();
  });

  it('should handle errors in processRetries gracefully', async () => {
    mockRepo.claimPendingRetries.mockRejectedValue(new Error('DB error'));
    const processRetries = (service as unknown as { processRetries: () => Promise<void> }).processRetries.bind(service);
    await expect(processRetries()).resolves.toBeUndefined();
  });
});
