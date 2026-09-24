import { createStoreFulfillmentPort } from '../../tests/testUtils';
import { CheckLocalDeliveryEligibilityUseCase } from './CheckLocalDeliveryEligibility';

describe('CheckLocalDeliveryEligibilityUseCase', () => {
  it('should return not eligible when no fulfillment port is configured', async () => {
    const useCase = new CheckLocalDeliveryEligibilityUseCase();

    const result = await useCase.execute({ latitude: 40.7, longitude: -74.0 });

    expect(result).toEqual({ eligible: false, options: [] });
  });

  it('should delegate eligibility to the fulfillment port when configured', async () => {
    const storeFulfillmentPort = createStoreFulfillmentPort();
    storeFulfillmentPort.checkLocalDeliveryEligibility.mockResolvedValue({
      eligible: true,
      options: [{ storeId: 's1', storeName: 'Store 1', deliveryFee: 5, estimatedDeliveryMinutes: 30 }],
    });
    const useCase = new CheckLocalDeliveryEligibilityUseCase(storeFulfillmentPort);

    const result = await useCase.execute({ latitude: 40.7, longitude: -74.0, postalCode: '10001' });

    expect(result.eligible).toBe(true);
    expect(result.options).toHaveLength(1);
    expect(storeFulfillmentPort.checkLocalDeliveryEligibility).toHaveBeenCalledWith({ latitude: 40.7, longitude: -74.0, postalCode: '10001' });
  });
});
