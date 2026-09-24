import { createStoreRepository, createStore } from '../../tests/testUtils';
import { ConfigureStorePickupUseCase } from './ConfigureStorePickup';
import { StoreNotFoundError } from '../../domain/errors/StoreErrors';

describe('ConfigureStorePickupUseCase', () => {
  let useCase: ConfigureStorePickupUseCase;
  let storeRepository: ReturnType<typeof createStoreRepository>;

  beforeEach(() => {
    storeRepository = createStoreRepository();
    storeRepository.findById.mockResolvedValue(createStore());
    storeRepository.updatePickupSettings.mockImplementation(async () => createStore());
    useCase = new ConfigureStorePickupUseCase(storeRepository);
  });

  it('should persist the pickup settings when the store exists', async () => {
    const result = await useCase.execute({
      storeId: 'store-1',
      enabled: true,
      settings: { prepareTimeMinutes: 30, maxHoldDays: 3 },
    });

    expect(result.pickupEnabled).toBe(true);
    expect(result.prepareTimeMinutes).toBe(30);
    expect(result.maxHoldDays).toBe(3);
    expect(storeRepository.updatePickupSettings).toHaveBeenCalledWith(
      'store-1',
      expect.objectContaining({ enabled: true, prepareTimeMinutes: 30, maxHoldDays: 3 }),
    );
  });

  it('should apply defaults when optional settings are not provided', async () => {
    const result = await useCase.execute({ storeId: 'store-1', enabled: true });

    expect(result.prepareTimeMinutes).toBe(60);
    expect(result.maxHoldDays).toBe(7);
    expect(storeRepository.updatePickupSettings).toHaveBeenCalledWith(
      'store-1',
      expect.objectContaining({ notifyOnReady: true, notifyMethods: ['email'], allowCurbside: false }),
    );
  });

  it('should throw StoreNotFoundError when the store does not exist', async () => {
    storeRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ storeId: 'missing', enabled: true })).rejects.toThrow(StoreNotFoundError);
    expect(storeRepository.updatePickupSettings).not.toHaveBeenCalled();
  });
});
