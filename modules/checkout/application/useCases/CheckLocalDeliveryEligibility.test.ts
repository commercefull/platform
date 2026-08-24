import { CheckLocalDeliveryEligibilityUseCase } from './CheckLocalDeliveryEligibility';

describe('CheckLocalDeliveryEligibilityUseCase', () => {
  it('should return not eligible when no port provided', async () => {
    const useCase = new CheckLocalDeliveryEligibilityUseCase();
    const result = await useCase.execute({ latitude: 40.7, longitude: -74.0 });

    expect(result.eligible).toBe(false);
    expect(result.options).toHaveLength(0);
  });

  it('should delegate to port when provided', async () => {
    const mockPort = {
      checkLocalDeliveryEligibility: jest.fn().mockResolvedValue({
        eligible: true,
        options: [{ storeId: 's1', storeName: 'Store 1', deliveryFee: 5, estimatedDeliveryMinutes: 30 }],
      }),
    };
    const useCase = new CheckLocalDeliveryEligibilityUseCase(mockPort as never);
    const result = await useCase.execute({ latitude: 40.7, longitude: -74.0, postalCode: '10001' });

    expect(result.eligible).toBe(true);
    expect(result.options).toHaveLength(1);
    expect(mockPort.checkLocalDeliveryEligibility).toHaveBeenCalledWith({ latitude: 40.7, longitude: -74.0, postalCode: '10001' });
  });
});
