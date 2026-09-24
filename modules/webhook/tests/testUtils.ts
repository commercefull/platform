/**
 * Shared test utilities for webhook unit tests.
 *
 * Import this file FIRST in each test file: it registers the boundary mocks
 * (uuid) before the use cases under test are evaluated.
 * Endpoint payloads are real WebhookEndpointProps literals — only the port is mocked.
 */

import type { WebhookEndpointProps } from '../domain/entities/WebhookEndpoint';
import type { WebhookRepositoryInterface } from '../domain/repositories/WebhookRepository';

jest.mock('../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn(() => 'test-uuid'),
}));

export function createWebhookEndpointProps(overrides: Partial<WebhookEndpointProps> = {}): WebhookEndpointProps {
  return {
    webhookEndpointId: 'wh-1',
    organizationId: null,
    name: 'Test Hook',
    url: 'https://example.com/hook',
    secret: 'secret-123',
    events: ['product.created'],
    isActive: true,
    headers: null,
    retryPolicy: { maxRetries: 5, retryIntervalMs: 5000, backoffMultiplier: 2 },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createWebhookRepository(): jest.Mocked<WebhookRepositoryInterface> {
  const repository: jest.Mocked<WebhookRepositoryInterface> = {
    createEndpoint: jest.fn(),
    findEndpointById: jest.fn(),
    findEndpointsByEvent: jest.fn(),
    findEndpoints: jest.fn(),
    updateEndpoint: jest.fn(),
    deleteEndpoint: jest.fn(),
    createDelivery: jest.fn(),
    findDeliveryById: jest.fn(),
    findDeliveries: jest.fn(),
    updateDelivery: jest.fn(),
    findPendingRetries: jest.fn(),
    claimPendingRetries: jest.fn(),
    releaseDeliveryLock: jest.fn(),
  };

  repository.createEndpoint.mockImplementation(props =>
    Promise.resolve({ ...props, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') }),
  );
  repository.findEndpointById.mockResolvedValue(createWebhookEndpointProps());
  repository.findEndpointsByEvent.mockResolvedValue([]);
  repository.findEndpoints.mockResolvedValue({ data: [], total: 0 });
  repository.updateEndpoint.mockResolvedValue(null);
  repository.deleteEndpoint.mockResolvedValue(true);
  repository.findDeliveryById.mockResolvedValue(null);
  repository.findDeliveries.mockResolvedValue({ data: [], total: 0 });
  repository.updateDelivery.mockResolvedValue(null);
  repository.findPendingRetries.mockResolvedValue([]);
  repository.claimPendingRetries.mockResolvedValue([]);
  repository.releaseDeliveryLock.mockResolvedValue(undefined);

  return repository;
}
