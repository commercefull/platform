import { ConfigureStorePickupUseCase } from './ConfigureStorePickup';
import { StoreNotFoundError } from '../../domain/errors/StoreErrors';

const mockStoreRepository = {
  findById: jest.fn().mockResolvedValue({ storeId: 's1', name: 'Main Store' }),
  updatePickupSettings: jest.fn().mockResolvedValue({
    storeId: 's1',
    updatedAt: new Date('2026-01-01'),
  }),
};

describe('ConfigureStorePickupUseCase', () => {
  let useCase: ConfigureStorePickupUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ConfigureStorePickupUseCase(mockStoreRepository as never);
  });

  it('should configure pickup (happy path)', async () => {
    const result = await useCase.execute({
      storeId: 's1', enabled: true,
      settings: { prepareTimeMinutes: 30, maxHoldDays: 14 },
    });

    expect(result.storeId).toBe('s1');
    expect(result.pickupEnabled).toBe(true);
    expect(result.prepareTimeMinutes).toBe(30);
    expect(result.maxHoldDays).toBe(14);
  });

  it('should use defaults when settings not provided', async () => {
    const result = await useCase.execute({ storeId: 's1', enabled: true });

    expect(result.prepareTimeMinutes).toBe(60);
    expect(result.maxHoldDays).toBe(7);
  });

  it('should throw StoreNotFoundError when store not found', async () => {
    mockStoreRepository.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute({ storeId: 'nonexistent', enabled: true }))
      .rejects.toThrow(StoreNotFoundError);
  });
});
