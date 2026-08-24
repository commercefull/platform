jest.mock('../../infrastructure/repositories/TaxQueryRepository', () => ({
  __esModule: true,
  default: {
    admin: {
      findAllTaxRates: jest.fn().mockResolvedValue([{ taxRateId: 'r1' }]),
      createTaxRate: jest.fn().mockResolvedValue({ taxRateId: 'r2' }),
      updateTaxRate: jest.fn().mockResolvedValue({ taxRateId: 'r1', rate: 0.1 }),
      softDeleteTaxRate: jest.fn().mockResolvedValue(true),
      findAllTaxZones: jest.fn().mockResolvedValue([{ taxZoneId: 'z1' }]),
      createTaxZone: jest.fn().mockResolvedValue({ taxZoneId: 'z2' }),
      updateTaxZone: jest.fn().mockResolvedValue({ taxZoneId: 'z1' }),
      softDeleteTaxZone: jest.fn().mockResolvedValue(true),
      findAllTaxClasses: jest.fn().mockResolvedValue([{ taxClassId: 'c1' }]),
      createTaxClass: jest.fn().mockResolvedValue({ taxClassId: 'c2' }),
      updateTaxClass: jest.fn().mockResolvedValue({ taxClassId: 'c1' }),
      softDeleteTaxClass: jest.fn().mockResolvedValue(true),
    },
  },
}));

import { ManageAdminTaxUseCase } from './ManageAdminTax';

describe('ManageAdminTaxUseCase', () => {
  let useCase: ManageAdminTaxUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageAdminTaxUseCase();
  });

  it('should find all tax rates', async () => {
    const result = await useCase.findAllTaxRates();
    expect(result).toHaveLength(1);
  });

  it('should create tax rate', async () => {
    const result = await useCase.createTaxRate({ rate: 0.08 } as never);
    expect(result).toEqual({ taxRateId: 'r2' });
  });

  it('should soft delete tax rate', async () => {
    const result = await useCase.softDeleteTaxRate('r1');
    expect(result).toBe(true);
  });

  it('should find all tax zones', async () => {
    const result = await useCase.findAllTaxZones();
    expect(result).toHaveLength(1);
  });

  it('should create tax zone', async () => {
    const result = await useCase.createTaxZone({ name: 'US' } as never);
    expect(result).toEqual({ taxZoneId: 'z2' });
  });

  it('should find all tax classes', async () => {
    const result = await useCase.findAllTaxClasses();
    expect(result).toHaveLength(1);
  });

  it('should create tax class', async () => {
    const result = await useCase.createTaxClass({ name: 'Standard' } as never);
    expect(result).toEqual({ taxClassId: 'c2' });
  });
});
