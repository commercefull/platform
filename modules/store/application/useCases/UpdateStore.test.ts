jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { UpdateStoreUseCase, UpdateStoreCommand } from './UpdateStore';
import { StoreNotFoundError, StoreSlugAlreadyExistsError, StoreValidationError } from '../../domain/errors/StoreErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('UpdateStoreUseCase', () => {
  let useCase: UpdateStoreUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockStore: Record<string, unknown>;

  beforeEach(() => {
    mockStore = {
      storeId: 's1', name: 'Old', slug: 'old', storeType: 'merchant_store', storeUrl: 'https://old.com',
      updateBasicInfo: jest.fn(), updateBranding: jest.fn(), updateAddress: jest.fn(),
      updateSEO: jest.fn(), updateCurrencies: jest.fn(), updateSettings: jest.fn(),
      updateSocialLinks: jest.fn(), setOpeningHours: jest.fn(), activate: jest.fn(),
      deactivate: jest.fn(), feature: jest.fn(), unfeature: jest.fn(),
      updatedAt: new Date(),
    };
    mockRepo = {
      findById: jest.fn().mockResolvedValue(mockStore),
      findBySlug: jest.fn().mockResolvedValue(null),
      findByUrl: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(mockStore),
    };
    useCase = new UpdateStoreUseCase(mockRepo as never);
  });

  it('should update store name (happy path)', async () => {
    const result = await useCase.execute(new UpdateStoreCommand('s1', { name: 'New Name' }));

    expect(result.storeId).toBe('s1');
    expect(mockStore.updateBasicInfo).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('store.updated', expect.objectContaining({ storeId: 's1' }));
  });

  it('should throw StoreNotFoundError when store does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateStoreCommand('missing', { name: 'X' }))).rejects.toThrow(StoreNotFoundError);
  });

  it('should throw StoreSlugAlreadyExistsError when slug is taken', async () => {
    mockRepo.findBySlug.mockResolvedValue({ storeId: 'other', slug: 'taken' });

    await expect(useCase.execute(new UpdateStoreCommand('s1', { slug: 'taken' }))).rejects.toThrow(StoreSlugAlreadyExistsError);
  });

  it('should throw StoreValidationError when URL is taken', async () => {
    mockRepo.findByUrl.mockResolvedValue({ storeId: 'other', storeUrl: 'https://taken.com' });

    await expect(useCase.execute(new UpdateStoreCommand('s1', { storeUrl: 'https://taken.com' }))).rejects.toThrow(StoreValidationError);
  });

  it('should activate store when isActive=true', async () => {
    await useCase.execute(new UpdateStoreCommand('s1', { isActive: true }));

    expect(mockStore.activate).toHaveBeenCalled();
  });

  it('should deactivate store when isActive=false', async () => {
    await useCase.execute(new UpdateStoreCommand('s1', { isActive: false }));

    expect(mockStore.deactivate).toHaveBeenCalled();
  });
});
