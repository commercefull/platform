/**
 * Unit Tests for Shipping Use Cases
 */

import { 
  CalculateShippingRatesCommand, 
  CalculateShippingRatesUseCase 
} from './CalculateShippingRates';
import { 
  GetShippingMethodsQuery, 
  GetShippingMethodsUseCase 
} from './GetShippingMethods';

// Mock the repositories
jest.mock('../../repos/shippingZoneRepo', () => ({
  __esModule: true,
  default: {
    findByLocation: jest.fn()
  }
}));

jest.mock('../../repos/shippingMethodRepo', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
    findByCarrier: jest.fn()
  }
}));

jest.mock('../../repos/shippingRateRepo', () => ({
  __esModule: true,
  default: {
    findByZoneAndMethod: jest.fn(),
    calculateRate: jest.fn()
  }
}));

jest.mock('../../repos/shippingCarrierRepo', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

import shippingZoneRepo from '../../repos/shippingZoneRepo';
import shippingMethodRepo from '../../repos/shippingMethodRepo';
import shippingRateRepo from '../../repos/shippingRateRepo';
import shippingCarrierRepo from '../../repos/shippingCarrierRepo';

describe('CalculateShippingRatesUseCase', () => {
  const useCase = new CalculateShippingRatesUseCase();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error when country is missing', async () => {
    const command = new CalculateShippingRatesCommand(
      { country: '' },
      { subtotal: 100, itemCount: 1 }
    );

    const result = await useCase.execute(command);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('country_required');
  });

  it('should return error when no zone found', async () => {
    (shippingZoneRepo.findByLocation as jest.Mock).mockResolvedValue([]);

    const command = new CalculateShippingRatesCommand(
      { country: 'US', state: 'CA' },
      { subtotal: 100, itemCount: 1 }
    );

    const result = await useCase.execute(command);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('no_zone_found');
  });

  it('should return error when no methods available', async () => {
    (shippingZoneRepo.findByLocation as jest.Mock).mockResolvedValue([
      { shippingZoneId: 'zone-1', name: 'US Domestic' }
    ]);
    (shippingMethodRepo.findAll as jest.Mock).mockResolvedValue([]);

    const command = new CalculateShippingRatesCommand(
      { country: 'US' },
      { subtotal: 100, itemCount: 1 }
    );

    const result = await useCase.execute(command);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('no_methods_available');
  });

  it('should calculate rates successfully', async () => {
    const mockZone = { shippingZoneId: 'zone-1', name: 'US Domestic' };
    const mockMethod = {
      shippingMethodId: 'method-1',
      name: 'Standard Shipping',
      code: 'STANDARD',
      shippingCarrierId: 'carrier-1',
      handlingDays: 3
    };
    const mockRate = {
      shippingRateId: 'rate-1',
      name: 'Standard Rate',
      rateType: 'flat',
      baseRate: '9.99',
      currency: 'USD',
      taxable: true
    };

    (shippingZoneRepo.findByLocation as jest.Mock).mockResolvedValue([mockZone]);
    (shippingMethodRepo.findAll as jest.Mock).mockResolvedValue([mockMethod]);
    (shippingRateRepo.findByZoneAndMethod as jest.Mock).mockResolvedValue(mockRate);
    (shippingRateRepo.calculateRate as jest.Mock).mockReturnValue(9.99);

    const command = new CalculateShippingRatesCommand(
      { country: 'US', state: 'CA' },
      { subtotal: 100, itemCount: 2 }
    );

    const result = await useCase.execute(command);

    expect(result.success).toBe(true);
    expect(result.rates).toHaveLength(1);
    expect(result.rates[0].amount).toBe(9.99);
    expect(result.rates[0].shippingMethodName).toBe('Standard Shipping');
  });

  it('should return free shipping when rate is 0', async () => {
    const mockZone = { shippingZoneId: 'zone-1', name: 'US Domestic' };
    const mockMethod = {
      shippingMethodId: 'method-1',
      name: 'Free Shipping',
      code: 'FREE',
      shippingCarrierId: null,
      handlingDays: 5
    };
    const mockRate = {
      shippingRateId: 'rate-1',
      name: 'Free Rate',
      rateType: 'free',
      baseRate: '0',
      currency: 'USD',
      taxable: false
    };

    (shippingZoneRepo.findByLocation as jest.Mock).mockResolvedValue([mockZone]);
    (shippingMethodRepo.findAll as jest.Mock).mockResolvedValue([mockMethod]);
    (shippingRateRepo.findByZoneAndMethod as jest.Mock).mockResolvedValue(mockRate);
    (shippingRateRepo.calculateRate as jest.Mock).mockReturnValue(0);

    const command = new CalculateShippingRatesCommand(
      { country: 'US' },
      { subtotal: 100, itemCount: 1 }
    );

    const result = await useCase.execute(command);

    expect(result.success).toBe(true);
    expect(result.rates[0].isFreeShipping).toBe(true);
    expect(result.rates[0].amount).toBe(0);
  });
});

describe('GetShippingMethodsUseCase', () => {
  const useCase = new GetShippingMethodsUseCase();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all methods', async () => {
    const mockMethods = [
      { shippingMethodId: 'method-1', name: 'Standard', code: 'STD', shippingCarrierId: null },
      { shippingMethodId: 'method-2', name: 'Express', code: 'EXP', shippingCarrierId: 'carrier-1' }
    ];

    (shippingMethodRepo.findAll as jest.Mock).mockResolvedValue(mockMethods);
    (shippingCarrierRepo.findById as jest.Mock).mockResolvedValue({ shippingCarrierId: 'carrier-1', name: 'UPS' });

    const query = new GetShippingMethodsQuery(true, false);
    const result = await useCase.execute(query);

    expect(result.success).toBe(true);
    expect(result.methods).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by carrier', async () => {
    const mockMethods = [
      { shippingMethodId: 'method-1', name: 'UPS Ground', code: 'UPS_GND', shippingCarrierId: 'carrier-1' }
    ];

    (shippingMethodRepo.findByCarrier as jest.Mock).mockResolvedValue(mockMethods);
    (shippingCarrierRepo.findById as jest.Mock).mockResolvedValue({ shippingCarrierId: 'carrier-1', name: 'UPS' });

    const query = new GetShippingMethodsQuery(true, false, 'carrier-1');
    const result = await useCase.execute(query);

    expect(result.success).toBe(true);
    expect(result.methods).toHaveLength(1);
    expect(shippingMethodRepo.findByCarrier).toHaveBeenCalledWith('carrier-1', true);
  });

  it('should enrich methods with carrier info', async () => {
    const mockMethods = [
      { shippingMethodId: 'method-1', name: 'UPS Ground', code: 'UPS_GND', shippingCarrierId: 'carrier-1' }
    ];
    const mockCarrier = { shippingCarrierId: 'carrier-1', name: 'UPS', code: 'UPS' };

    (shippingMethodRepo.findAll as jest.Mock).mockResolvedValue(mockMethods);
    (shippingCarrierRepo.findById as jest.Mock).mockResolvedValue(mockCarrier);

    const query = new GetShippingMethodsQuery(true, false);
    const result = await useCase.execute(query);

    expect(result.success).toBe(true);
    expect(result.methods[0].carrier).toEqual(mockCarrier);
  });

  it('should return empty array when no methods found', async () => {
    (shippingMethodRepo.findAll as jest.Mock).mockResolvedValue([]);

    const query = new GetShippingMethodsQuery(true, true);
    const result = await useCase.execute(query);

    expect(result.success).toBe(true);
    expect(result.methods).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
