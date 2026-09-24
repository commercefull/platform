import { createStoreRepository, createStore } from '../../tests/testUtils';
import { SetLocalDeliveryZoneUseCase } from './SetLocalDeliveryZone';
import { StoreNotFoundError, StoreValidationError } from '../../domain/errors/StoreErrors';

describe('SetLocalDeliveryZoneUseCase', () => {
  let useCase: SetLocalDeliveryZoneUseCase;
  let storeRepository: ReturnType<typeof createStoreRepository>;

  beforeEach(() => {
    storeRepository = createStoreRepository();
    storeRepository.findById.mockResolvedValue(createStore());
    storeRepository.updateLocalDeliverySettings.mockImplementation(async () => createStore());
    useCase = new SetLocalDeliveryZoneUseCase(storeRepository);
  });

  it('should persist the delivery zone when a radius is provided', async () => {
    const result = await useCase.execute({ storeId: 'store-1', enabled: true, radiusKm: 10, deliveryFee: 4.5 });

    expect(result.localDeliveryEnabled).toBe(true);
    expect(result.radiusKm).toBe(10);
    expect(result.deliveryFee).toBe(4.5);
    expect(storeRepository.updateLocalDeliverySettings).toHaveBeenCalledWith(
      'store-1',
      expect.objectContaining({ enabled: true, radiusKm: 10, deliveryFee: 4.5 }),
    );
  });

  it('should persist the delivery zone when postal codes are provided', async () => {
    const result = await useCase.execute({ storeId: 'store-1', enabled: true, postalCodes: ['10001', '10002'] });

    expect(result.localDeliveryEnabled).toBe(true);
    expect(result.postalCodeCount).toBe(2);
    expect(storeRepository.updateLocalDeliverySettings).toHaveBeenCalledWith(
      'store-1',
      expect.objectContaining({ postalCodes: ['10001', '10002'] }),
    );
  });

  it('should throw StoreNotFoundError when the store does not exist', async () => {
    storeRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ storeId: 'missing', enabled: true, radiusKm: 5 })).rejects.toThrow(StoreNotFoundError);
    expect(storeRepository.updateLocalDeliverySettings).not.toHaveBeenCalled();
  });

  it('should throw StoreValidationError when enabling without radius or postal codes', async () => {
    await expect(useCase.execute({ storeId: 'store-1', enabled: true })).rejects.toThrow(StoreValidationError);
    expect(storeRepository.updateLocalDeliverySettings).not.toHaveBeenCalled();
  });

  it('should allow disabling without a zone definition', async () => {
    const result = await useCase.execute({ storeId: 'store-1', enabled: false });

    expect(result.localDeliveryEnabled).toBe(false);
    expect(storeRepository.updateLocalDeliverySettings).toHaveBeenCalledWith(
      'store-1',
      expect.objectContaining({ enabled: false }),
    );
  });
});
