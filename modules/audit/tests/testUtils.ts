/**
 * Shared test utilities for audit unit tests.
 *
 * Factories produce typed mocks of the domain port and real command inputs.
 */

import type { AuditRepository } from '../domain/repositories/AuditRepository';
import type { RecordAuditLogCommand } from '../application/useCases/RecordAuditLog';

export function createAuditRepository(overrides: Partial<jest.Mocked<AuditRepository>> = {}): jest.Mocked<AuditRepository> {
  const repository: jest.Mocked<AuditRepository> = {
    getLatestHash: jest.fn(),
    append: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findByActor: jest.fn(),
    findByResource: jest.fn(),
    findByCorrelationId: jest.fn(),
    verifyChain: jest.fn(),
    countByAction: jest.fn(),
    countByActor: jest.fn(),
  };

  repository.getLatestHash.mockResolvedValue('genesis');
  repository.append.mockImplementation(entry => Promise.resolve(entry));
  repository.findById.mockResolvedValue(null);
  repository.findAll.mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0, hasMore: false, length: 0 });
  repository.findByActor.mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0, hasMore: false, length: 0 });
  repository.findByResource.mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0, hasMore: false, length: 0 });
  repository.findByCorrelationId.mockResolvedValue([]);
  repository.verifyChain.mockResolvedValue({ valid: true });
  repository.countByAction.mockResolvedValue({});
  repository.countByActor.mockResolvedValue({});

  return { ...repository, ...overrides };
}

export function createAuditLogCommand(overrides: Partial<RecordAuditLogCommand> = {}): RecordAuditLogCommand {
  return {
    actorId: 'user-1',
    actorType: 'admin',
    action: 'product.create',
    resourceType: 'product',
    resourceId: 'prod-1',
    ...overrides,
  };
}
