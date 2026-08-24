import { SetLocalDeliveryZoneUseCase } from './SetLocalDeliveryZone';
import { StoreNotFoundError, StoreValidationError } from '../../domain/errors/StoreErrors';

const mockStoreRepository = {
  findById: jest.fn().mockResolvedValue({ storeId: 's1' }),
  updateLocalDeliverySettings: jest.fn().mockResolvedValue({
    storeId: 's1',
    updatedAt: new Date('2026-01-01'),
  }),
};

describe('SetLocalDeliveryZoneUseCase', () => {
  let useCase: SetLocalDeliveryZoneUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new SetLocalDeliveryZoneUseCase(mockStoreRepository as never);
  });

  it('should set delivery zone with radius (happy path)', async () => {
    const result = await useCase.execute({
      storeId: 's1', enabled: true, radiusKm: 10, deliveryFee: 5,
    });

    expect(result.storeId).toBe('s1');
    expect(result.localDeliveryEnabled).toBe(true);
    expect(result.radiusKm).toBe(10);
    expect(result.deliveryFee).toBe(5);
  });

  it('should set delivery zone with postal codes', async () => {
    const result = await useCase.execute({
      storeId: 's1', enabled: true, postalCodes: ['10001', '10002'],
    });

    expect(result.postalCodeCount).toBe(2);
  });

  it('should throw StoreNotFoundError when store not found', async () => {
    mockStoreRepository.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute({ storeId: 'nonexistent', enabled: true, radiusKm: 5 }))
      .rejects.toThrow(StoreNotFoundError);
  });

  it('should throw StoreValidationError when no radius or postal codes', async () => {
    await expect(useCase.execute({ storeId: 's1', enabled: true }))
      .rejects.toThrow(StoreValidationError);
  });
});
