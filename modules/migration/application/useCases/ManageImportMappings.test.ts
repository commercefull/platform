import '../../tests/testUtils';
import { ManageImportMappingsUseCase } from './ManageImportMappings';
import type { ImportMappingRepository } from '../../domain/repositories/MigrationRepository';
import { createImportMapping, lazyMock } from '../../tests/testUtils';

describe('ManageImportMappingsUseCase', () => {
  it('should create a mapping through the repository', async () => {
    const repo = lazyMock<ImportMappingRepository>();
    repo.create.mockImplementation(async m => m);

    const result = await new ManageImportMappingsUseCase(repo).createMapping({
      importJobId: 'j-1', entityType: 'product', sourceId: 's-1', platformId: 'p-1',
    });

    expect(result.importJobId).toBe('j-1');
    expect(repo.create).toHaveBeenCalled();
  });

  it('should find mappings by job', async () => {
    const repo = lazyMock<ImportMappingRepository>();
    repo.findByJob.mockResolvedValue([createImportMapping()]);

    const result = await new ManageImportMappingsUseCase(repo).findByJob('job-1');

    expect(result).toHaveLength(1);
  });
});

