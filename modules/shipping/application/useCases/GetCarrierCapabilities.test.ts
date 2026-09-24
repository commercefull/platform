import { createShippingCarrierPort, createShippingCarrier } from '../../tests/testUtils';
import { GetCarrierCapabilitiesUseCase } from './GetCarrierCapabilities';

describe('GetCarrierCapabilitiesUseCase', () => {
  let useCase: GetCarrierCapabilitiesUseCase;
  let carrierRepo: ReturnType<typeof createShippingCarrierPort>;

  beforeEach(() => {
    carrierRepo = createShippingCarrierPort();
    useCase = new GetCarrierCapabilitiesUseCase(carrierRepo);
  });

  it('should return the carrier capabilities', async () => {
    carrierRepo.findByCode.mockResolvedValue(
      createShippingCarrier({
        supportedServices: ['ground'],
        supportedRegions: ['US'],
        hasApiIntegration: true,
        requiresContract: false,
      }),
    );

    const result = await useCase.execute('ups');

    expect(result.supportedServices).toEqual(['ground']);
    expect(result.hasApiIntegration).toBe(true);
  });

  it('should return an empty object when the carrier does not exist', async () => {
    carrierRepo.findByCode.mockResolvedValue(null);

    const result = await useCase.execute('nonexistent');

    expect(result).toEqual({});
  });

  it('should return an empty object when the repository throws', async () => {
    carrierRepo.findByCode.mockRejectedValue(new Error('db down'));

    const result = await useCase.execute('ups');

    expect(result).toEqual({});
  });
});
