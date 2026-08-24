jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CalculateRatesUseCase} from './CalculateRates';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CalculateRatesUseCase', () => {
  let useCase: CalculateRatesUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findZonesForAddress: jest.fn().mockResolvedValue([{ shippingZoneId: 'z1', name: 'US', isActive: true }]),
      findDefaultZone: jest.fn().mockResolvedValue(null),
      findMethodsForZones: jest.fn().mockResolvedValue([
        {
          shippingMethodId: 'm1', name: 'Standard', code: 'std', isDefault: true,
          estimatedDaysMin: 3, estimatedDaysMax: 5, carrierType: 'fedex',
          isAvailableFor: jest.fn().mockReturnValue(true),
          calculateRate: jest.fn().mockReturnValue(9.99),
        },
        {
          shippingMethodId: 'm2', name: 'Express', code: 'exp', isDefault: false,
          estimatedDaysMin: 1, estimatedDaysMax: 2, carrierType: 'ups',
          isAvailableFor: jest.fn().mockReturnValue(true),
          calculateRate: jest.fn().mockReturnValue(19.99),
        },
      ]),
    };
    useCase = new CalculateRatesUseCase(mockRepo as never);
  });

  it('should calculate shipping rates (happy path)', async () => {
    const result = await useCase.execute({
      destinationAddress: { countryCode: 'US', stateCode: 'CA' },
      items: [{ productId: 'p1', quantity: 2, weight: 1.5, price: 50 }],
      orderValue: 100,
    });

    expect(result.rates).toHaveLength(2);
    expect(result.rates[0].rate).toBe(9.99);
    expect(result.defaultRateId).toBe('m1');
    expect(eventBus.emit).toHaveBeenCalledWith('shipping.rate_calculated', expect.objectContaining({ destinationCountry: 'US' }));
  });

  it('should use default zone when no zones match', async () => {
    mockRepo.findZonesForAddress.mockResolvedValue([]);
    mockRepo.findDefaultZone.mockResolvedValue({ shippingZoneId: 'default-z', name: 'Default', isActive: true });

    await useCase.execute({
      destinationAddress: { countryCode: 'XX' },
      items: [{ productId: 'p1', quantity: 1, price: 10 }],
      orderValue: 10,
    });

    expect(mockRepo.findDefaultZone).toHaveBeenCalled();
  });

  it('should skip unavailable methods', async () => {
    mockRepo.findMethodsForZones.mockResolvedValue([
      {
        shippingMethodId: 'm1', name: 'Standard', code: 'std', isDefault: true,
        estimatedDaysMin: 3, estimatedDaysMax: 5, carrierType: 'fedex',
        isAvailableFor: jest.fn().mockReturnValue(false),
        calculateRate: jest.fn().mockReturnValue(9.99),
      },
      {
        shippingMethodId: 'm2', name: 'Express', code: 'exp', isDefault: false,
        estimatedDaysMin: 1, estimatedDaysMax: 2, carrierType: 'ups',
        isAvailableFor: jest.fn().mockReturnValue(true),
        calculateRate: jest.fn().mockReturnValue(19.99),
      },
    ]);

    const result = await useCase.execute({
      destinationAddress: { countryCode: 'US' },
      items: [{ productId: 'p1', quantity: 1, weight: 100, price: 10 }],
      orderValue: 10,
    });

    expect(result.rates).toHaveLength(1);
    expect(result.rates[0].code).toBe('exp');
  });

  it('should set defaultRateId to cheapest when no default method', async () => {
    mockRepo.findMethodsForZones.mockResolvedValue([
      {
        shippingMethodId: 'm1', name: 'Standard', code: 'std', isDefault: false,
        estimatedDaysMin: 3, estimatedDaysMax: 5, carrierType: 'fedex',
        isAvailableFor: jest.fn().mockReturnValue(true),
        calculateRate: jest.fn().mockReturnValue(9.99),
      },
      {
        shippingMethodId: 'm2', name: 'Express', code: 'exp', isDefault: false,
        estimatedDaysMin: 1, estimatedDaysMax: 2, carrierType: 'ups',
        isAvailableFor: jest.fn().mockReturnValue(true),
        calculateRate: jest.fn().mockReturnValue(19.99),
      },
    ]);

    const result = await useCase.execute({
      destinationAddress: { countryCode: 'US' },
      items: [{ productId: 'p1', quantity: 1, price: 10 }],
      orderValue: 10,
    });

    expect(result.defaultRateId).toBe('m1');
  });
});
