jest.mock('../../infrastructure/repositories/ShippingConfigRepository', () => ({
  __esModule: true,
  default: {
    carriers: {},
    methods: {},
    zones: {
      findById: jest.fn().mockResolvedValue({ shippingZoneId: 'z1', name: 'US' }),
      findAll: jest.fn().mockResolvedValue([{ shippingZoneId: 'z1' }]),
      findByLocation: jest.fn().mockResolvedValue([
        { shippingZoneId: 'z1', name: 'US Zone', isActive: true },
      ]),
      create: jest.fn(),
      update: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      delete: jest.fn(),
    },
    rates: {
      findById: jest.fn(),
      findActive: jest.fn(),
      findByMethod: jest.fn(),
      findByZoneAndMethod: jest.fn().mockResolvedValue({
        shippingRateId: 'r1', rateType: 'flat', baseRate: 10, currency: 'USD',
        name: 'Standard', taxable: false, conditions: null,
      }),
      create: jest.fn(),
      update: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      delete: jest.fn(),
      calculateRate: jest.fn().mockReturnValue(10),
    },
  },
}));

import { CalculateShippingRatesUseCase, CalculateShippingRatesCommand } from './CalculateShippingRates';
import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';

const mockRepo = shippingConfigRepository as unknown as { zones: Record<string, jest.Mock> };

describe('CalculateShippingRatesUseCase', () => {
  let useCase: CalculateShippingRatesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CalculateShippingRatesUseCase();
  });

  it('should return error when country is missing', async () => {
    const result = await useCase.execute(new CalculateShippingRatesCommand(
      { country: '' }, { subtotal: 100, itemCount: 1 },
    ));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('country_required');
  });

  it('should return error when no zone found', async () => {
    mockRepo.zones.findByLocation.mockResolvedValueOnce([]);

    const result = await useCase.execute(new CalculateShippingRatesCommand(
      { country: 'XX' }, { subtotal: 100, itemCount: 1 },
    ));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('no_zone_found');
  });
});
