import { RecordAuditLogUseCase, RecordAuditLogCommand } from './RecordAuditLog';
import { AuditLog } from '../../domain/entities/AuditLog';
import type { AuditRepository } from '../../domain/repositories/AuditRepository';

function createMockRepo(overrides: Partial<AuditRepository> = {}): AuditRepository {
  const base: AuditRepository = {
    getLatestHash: jest.fn().mockResolvedValue('genesis'),
    append: jest.fn().mockImplementation(async (entry: AuditLog) => entry),
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0, hasMore: false, length: 0 }),
    findByActor: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0, hasMore: false, length: 0 }),
    findByResource: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0, hasMore: false, length: 0 }),
    findByCorrelationId: jest.fn().mockResolvedValue([]),
    verifyChain: jest.fn().mockResolvedValue({ valid: true }),
    countByAction: jest.fn().mockResolvedValue({}),
    countByActor: jest.fn().mockResolvedValue({}),
  };
  return { ...base, ...overrides };
}

describe('RecordAuditLogUseCase', () => {
  it('should create and append an audit log entry', async () => {
    const repo = createMockRepo();
    const useCase = new RecordAuditLogUseCase(repo);

    const command: RecordAuditLogCommand = {
      actorId: 'user-1',
      actorType: 'admin',
      action: 'product.create',
      resourceType: 'product',
      resourceId: 'prod-1',
      resourceName: 'Widget',
    };

    const result = await useCase.execute(command);

    expect(repo.getLatestHash).toHaveBeenCalled();
    expect(repo.append).toHaveBeenCalled();
    expect(result.actorId).toBe('user-1');
    expect(result.action).toBe('product.create');
    expect(result.previousHash).toBe('genesis');
    expect(result.hash).toBeDefined();
  });

  it('should chain to previous hash from the repository', async () => {
    const repo = createMockRepo({
      getLatestHash: jest.fn().mockResolvedValue('previous-hash-123'),
    });
    const useCase = new RecordAuditLogUseCase(repo);

    const result = await useCase.execute({
      actorId: 'user-2',
      actorType: 'organization',
      action: 'order.refund',
      resourceType: 'order',
      resourceId: 'ord-1',
    });

    expect(result.previousHash).toBe('previous-hash-123');
  });

  it('should throw AuditLogWriteError when append fails', async () => {
    const repo = createMockRepo({
      append: jest.fn().mockRejectedValue(new Error('DB connection failed')),
    });
    const useCase = new RecordAuditLogUseCase(repo);

    await expect(
      useCase.execute({
        actorId: 'user-3',
        actorType: 'admin',
        action: 'product.delete',
        resourceType: 'product',
        resourceId: 'prod-2',
      }),
    ).rejects.toThrow('Failed to write audit log');
  });

  it('should pass metadata through to the audit entry', async () => {
    const repo = createMockRepo();
    const useCase = new RecordAuditLogUseCase(repo);

    const metadata = { oldValues: { price: 10 }, newValues: { price: 20 } };

    const result = await useCase.execute({
      actorId: 'user-4',
      actorType: 'admin',
      action: 'product.update',
      resourceType: 'product',
      resourceId: 'prod-3',
      metadata,
    });

    expect(result.metadata).toEqual(metadata);
  });
});
