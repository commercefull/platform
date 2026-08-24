jest.mock('../../infrastructure/repositories/ShippingConfigRepository', () => ({
  __esModule: true,
  default: {
    carriers: {
      findById: jest.fn(),
      findByCode: jest.fn().mockResolvedValue({
        shippingCarrierId: 'c1', name: 'UPS', code: 'ups',
        supportedServices: ['ground'], supportedRegions: ['US'],
        hasApiIntegration: true, requiresContract: false,
      }),
    },
    methods: {},
    zones: {},
    rates: {},
  },
}));

import { GetCarrierCapabilitiesUseCase } from './GetCarrierCapabilities';
import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';

const mockRepo = shippingConfigRepository as unknown as { carriers: Record<string, jest.Mock> };

describe('GetCarrierCapabilitiesUseCase', () => {
  let useCase: GetCarrierCapabilitiesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetCarrierCapabilitiesUseCase();
  });

  it('should return carrier capabilities (happy path)', async () => {
    const result = await useCase.execute('ups');

    expect(result.supportedServices).toEqual(['ground']);
    expect(result.hasApiIntegration).toBe(true);
  });

  it('should return empty object when carrier not found', async () => {
    mockRepo.carriers.findByCode.mockResolvedValueOnce(null);

    const result = await useCase.execute('nonexistent');
    expect(result).toEqual({});
  });
});
