import '../../tests/testUtils';
import { ManageTrackingConfigUseCase } from './ManageTrackingConfig';
import { TrackingConfigNotFoundError, TrackingConfigAlreadyExistsError } from '../../domain/errors/TrackingErrors';
import type { TrackingConfigRepository } from '../../domain/repositories/TrackingConfigRepository';
import { createTrackingConfig, lazyMock, uuidMock } from '../../tests/testUtils';

describe('ManageTrackingConfigUseCase', () => {
  let repo: jest.Mocked<TrackingConfigRepository>;
  let useCase: ManageTrackingConfigUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<TrackingConfigRepository>();
    repo.save.mockImplementation(async c => c);
    uuidMock.mockReturnValue('uuid-1');
    useCase = new ManageTrackingConfigUseCase(repo);
  });

  it('should create a config with default event mappings', async () => {
    repo.findByStoreId.mockResolvedValue(null);

    const result = await useCase.create({
      storeId: 's-1', organizationId: 'org-1',
      gtm: { containerId: 'GTM-1', serverContainerUrl: 'https://gtm.test' },
    });

    expect(result.eventMappings.length).toBeGreaterThan(0);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw TrackingConfigAlreadyExistsError when the store already has a config', async () => {
    repo.findByStoreId.mockResolvedValue(createTrackingConfig());

    await expect(useCase.create({ storeId: 's-1', organizationId: 'org-1' }))
      .rejects.toThrow(TrackingConfigAlreadyExistsError);
  });

  it('should throw TrackingConfigNotFoundError when updating a missing store', async () => {
    repo.findByStoreId.mockResolvedValue(null);

    await expect(useCase.updateGtm('missing', { containerId: 'x', serverContainerUrl: 'y' }))
      .rejects.toThrow(TrackingConfigNotFoundError);
  });
});
