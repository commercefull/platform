import '../../tests/testUtils';
import { ProcessTrackingEventUseCase } from './ProcessTrackingEvent';
import { TrackingConfigNotFoundError, TrackingEventNotMappedError } from '../../domain/errors/TrackingErrors';
import type { TrackingConfigRepository } from '../../domain/repositories/TrackingConfigRepository';
import type { TrackingAdapter } from '../../domain/services/TrackingAdapter';
import { createTrackingConfig, lazyMock, uuidMock } from '../../tests/testUtils';

describe('ProcessTrackingEventUseCase', () => {
  let repo: jest.Mocked<TrackingConfigRepository>;
  let gtmAdapter: TrackingAdapter;
  let metaAdapter: TrackingAdapter;
  let useCase: ProcessTrackingEventUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<TrackingConfigRepository>();
    gtmAdapter = { providerName: 'gtm', send: jest.fn().mockResolvedValue({ success: true, provider: 'gtm', eventId: 'e-1' }), validateConfig: jest.fn() };
    metaAdapter = { providerName: 'meta_capi', send: jest.fn().mockResolvedValue({ success: true, provider: 'meta_capi', eventId: 'e-1' }), validateConfig: jest.fn() };
    uuidMock.mockReturnValue('uuid-1');
    useCase = new ProcessTrackingEventUseCase(repo, gtmAdapter, metaAdapter);
  });

  it('should send a mapped event to enabled providers when consent is granted', async () => {
    repo.findByStoreId.mockResolvedValue(createTrackingConfig({
      metaCapi: { pixelId: 'px-1', accessToken: 'tok' },
    }));

    const result = await useCase.execute({
      storeId: 's-1', sourceEvent: 'order.paid', userData: {}, consentGranted: true,
    });

    expect(result.sent).toHaveLength(2);
    expect(gtmAdapter.send).toHaveBeenCalled();
    expect(metaAdapter.send).toHaveBeenCalled();
  });

  it('should skip when tracking is disabled', async () => {
    const config = createTrackingConfig();
    config.disable();
    repo.findByStoreId.mockResolvedValue(config);

    const result = await useCase.execute({
      storeId: 's-1', sourceEvent: 'order.paid', userData: {}, consentGranted: true,
    });

    expect(result.skipped).toContain('tracking_disabled');
  });

  it('should skip when consent is not granted', async () => {
    repo.findByStoreId.mockResolvedValue(createTrackingConfig());

    const result = await useCase.execute({
      storeId: 's-1', sourceEvent: 'order.paid', userData: {}, consentGranted: false,
    });

    expect(result.skipped).toContain('consent_not_granted');
    expect(gtmAdapter.send).not.toHaveBeenCalled();
  });

  it('should throw TrackingEventNotMappedError when the event has no mapping', async () => {
    repo.findByStoreId.mockResolvedValue(createTrackingConfig());

    await expect(useCase.execute({
      storeId: 's-1', sourceEvent: 'unknown.event', userData: {}, consentGranted: true,
    })).rejects.toThrow(TrackingEventNotMappedError);
  });

  it('should throw TrackingConfigNotFoundError when the store has no config', async () => {
    repo.findByStoreId.mockResolvedValue(null);

    await expect(useCase.execute({
      storeId: 'missing', sourceEvent: 'order.paid', userData: {}, consentGranted: true,
    })).rejects.toThrow(TrackingConfigNotFoundError);
  });
});
