import '../../tests/testUtils';
import { ManageImportJobsUseCase } from './ManageImportJobs';
import { ImportJobNotFoundError } from '../../domain/errors/MigrationErrors';
import type { ImportJobRepository } from '../../domain/repositories/MigrationRepository';
import { createImportJob, lazyMock } from '../../tests/testUtils';

describe('ManageImportJobsUseCase', () => {
  let repo: jest.Mocked<ImportJobRepository>;
  let useCase: ManageImportJobsUseCase;

  beforeEach(() => {
    repo = lazyMock<ImportJobRepository>();
    repo.create.mockImplementation(async j => j);
    repo.update.mockImplementation(async j => j);
    useCase = new ManageImportJobsUseCase(repo);
  });

  it('should create a job in pending status', async () => {
    const result = await useCase.createJob({ organizationId: 'org-1', jobType: 'products', source: 'shopify' });

    expect(result.status).toBe('pending');
    expect(repo.create).toHaveBeenCalled();
  });

  it('should throw ImportJobNotFoundError when the job does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.getJob('missing')).rejects.toThrow(ImportJobNotFoundError);
  });

  it('should transition the job to running when started', async () => {
    repo.findById.mockResolvedValue(createImportJob());

    const result = await useCase.startJob('j-1');

    expect(result.status).toBe('running');
    expect(repo.update).toHaveBeenCalled();
  });

  it('should record stats when records are processed', async () => {
    const job = createImportJob();
    job.start();
    repo.findById.mockResolvedValue(job);

    const result = await useCase.recordSuccess('j-1');

    expect(result.stats.successCount).toBe(1);
  });
});

