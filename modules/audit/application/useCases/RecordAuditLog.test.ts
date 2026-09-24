import { createAuditLogCommand, createAuditRepository } from '../../tests/testUtils';
import { RecordAuditLogUseCase } from './RecordAuditLog';
import { AuditLogWriteError } from '../../domain/errors/AuditErrors';

describe('RecordAuditLogUseCase', () => {
  it('should append a hash-chained audit entry when the command is valid', async () => {
    const repository = createAuditRepository();

    const result = await new RecordAuditLogUseCase(repository).execute(
      createAuditLogCommand({ actorId: 'user-1', resourceName: 'Widget' }),
    );

    expect(repository.append).toHaveBeenCalled();
    expect(result.actorId).toBe('user-1');
    expect(result.action).toBe('product.create');
    expect(result.previousHash).toBe('genesis');
    expect(result.hash).toBeDefined();
  });

  it('should chain to the latest hash when previous entries exist', async () => {
    const repository = createAuditRepository();
    repository.getLatestHash.mockResolvedValue('previous-hash-123');

    const result = await new RecordAuditLogUseCase(repository).execute(
      createAuditLogCommand({ actorId: 'user-2', actorType: 'organization', action: 'order.refund', resourceType: 'order', resourceId: 'ord-1' }),
    );

    expect(result.previousHash).toBe('previous-hash-123');
  });

  it('should throw AuditLogWriteError when the repository append fails', async () => {
    const repository = createAuditRepository();
    repository.append.mockRejectedValue(new Error('DB connection failed'));

    await expect(new RecordAuditLogUseCase(repository).execute(createAuditLogCommand())).rejects.toThrow(AuditLogWriteError);
  });

  it('should pass metadata through to the audit entry when provided', async () => {
    const repository = createAuditRepository();
    const metadata = { oldValues: { price: 10 }, newValues: { price: 20 } };

    const result = await new RecordAuditLogUseCase(repository).execute(
      createAuditLogCommand({ action: 'product.update', metadata }),
    );

    expect(result.metadata).toEqual(metadata);
  });
});
