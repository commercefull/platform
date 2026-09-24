import '../../tests/testUtils';
import { ManageImportErrorsUseCase } from './ManageImportErrors';
import type { ImportErrorRepository } from '../../domain/repositories/MigrationRepository';
import { createImportError, lazyMock } from '../../tests/testUtils';

describe('ManageImportErrorsUseCase', () => {
  it('should create and resolve import errors', async () => {
    const repo = lazyMock<ImportErrorRepository>();
    repo.create.mockImplementation(async e => e);
    repo.update.mockImplementation(async e => e);
    repo.findById.mockResolvedValue(createImportError());
    const useCase = new ManageImportErrorsUseCase(repo);

    const created = await useCase.createError({ importJobId: 'j-1', entityType: 'product', message: 'x' });
    expect(created.message).toBe('x');

    await useCase.resolveError('e-1');
    expect(repo.update).toHaveBeenCalled();
    expect((await repo.findById('e-1'))?.isResolved).toBe(true);
  });
});
