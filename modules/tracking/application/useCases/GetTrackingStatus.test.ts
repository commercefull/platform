import '../../tests/testUtils';
import { GetTrackingStatusUseCase } from './GetTrackingStatus';
import type { TrackingConfigRepository } from '../../domain/repositories/TrackingConfigRepository';
import { createTrackingConfig, lazyMock } from '../../tests/testUtils';

describe('GetTrackingStatusUseCase', () => {
  it('should return not_configured when the store has no config', async () => {
    const repo = lazyMock<TrackingConfigRepository>();
    repo.findByStoreId.mockResolvedValue(null);

    const result = await new GetTrackingStatusUseCase(repo).execute('s-1');

    expect(result.configured).toBe(false);
    expect(result.status).toBe('not_configured');
  });

  it('should report provider state when configured', async () => {
    const repo = lazyMock<TrackingConfigRepository>();
    repo.findByStoreId.mockResolvedValue(createTrackingConfig());

    const result = await new GetTrackingStatusUseCase(repo).execute('s-1');

    expect(result.configured).toBe(true);
    expect(result.gtmEnabled).toBe(true);
    expect(result.eventMappingCount).toBeGreaterThan(0);
  });
});
