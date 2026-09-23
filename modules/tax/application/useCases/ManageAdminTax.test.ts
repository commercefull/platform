/**
 * Unit Tests for ManageAdminTax Use Case
 */

import { createTaxAdminPort } from '../../tests/testUtils';
import { ManageAdminTaxUseCase } from './ManageAdminTax';
import type { AdminTaxRateRecord, AdminTaxZoneRecord, AdminTaxClassRecord } from './ManageAdminTax';

describe('ManageAdminTaxUseCase', () => {
  let useCase: ManageAdminTaxUseCase;
  let adminRepo: ReturnType<typeof createTaxAdminPort>;

  const rate: AdminTaxRateRecord = {
    taxRateId: 'r1',
    name: 'US Standard',
    rate: 0.07,
    country: 'US',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const zone: AdminTaxZoneRecord = {
    taxZoneId: 'z1',
    name: 'US',
    countries: ['US'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const taxClass: AdminTaxClassRecord = {
    taxClassId: 'c1',
    name: 'Standard',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    adminRepo = createTaxAdminPort();
    useCase = new ManageAdminTaxUseCase(adminRepo);
  });

  it('should return all tax rates', async () => {
    adminRepo.findAllTaxRates.mockResolvedValue([rate]);

    const result = await useCase.findAllTaxRates();

    expect(result).toEqual([rate]);
  });

  it('should create a tax rate with the given params', async () => {
    const params = { name: 'CA State', rate: 0.08, country: 'US', state: 'CA', isActive: true };

    await useCase.createTaxRate(params);

    expect(adminRepo.createTaxRate).toHaveBeenCalledWith(params);
  });

  it('should update a tax rate with the given params', async () => {
    const params = { name: 'CA State', rate: 0.09, country: 'US', state: 'CA', isActive: true };

    await useCase.updateTaxRate('r1', params);

    expect(adminRepo.updateTaxRate).toHaveBeenCalledWith('r1', params);
  });

  it('should soft delete a tax rate', async () => {
    await useCase.softDeleteTaxRate('r1');

    expect(adminRepo.softDeleteTaxRate).toHaveBeenCalledWith('r1');
  });

  it('should return all tax zones', async () => {
    adminRepo.findAllTaxZones.mockResolvedValue([zone]);

    const result = await useCase.findAllTaxZones();

    expect(result).toEqual([zone]);
  });

  it('should create a tax zone with the given params', async () => {
    const params = { name: 'EU', countries: ['DE', 'FR'], isActive: true };

    await useCase.createTaxZone(params);

    expect(adminRepo.createTaxZone).toHaveBeenCalledWith(params);
  });

  it('should update a tax zone with the given params', async () => {
    const params = { name: 'EU+UK', countries: ['DE', 'FR', 'GB'], isActive: true };

    await useCase.updateTaxZone('z1', params);

    expect(adminRepo.updateTaxZone).toHaveBeenCalledWith('z1', params);
  });

  it('should soft delete a tax zone', async () => {
    await useCase.softDeleteTaxZone('z1');

    expect(adminRepo.softDeleteTaxZone).toHaveBeenCalledWith('z1');
  });

  it('should return all tax classes', async () => {
    adminRepo.findAllTaxClasses.mockResolvedValue([taxClass]);

    const result = await useCase.findAllTaxClasses();

    expect(result).toEqual([taxClass]);
  });

  it('should create a tax class with the given params', async () => {
    await useCase.createTaxClass({ name: 'Reduced', description: 'Reduced rate goods' });

    expect(adminRepo.createTaxClass).toHaveBeenCalledWith({ name: 'Reduced', description: 'Reduced rate goods' });
  });

  it('should update a tax class with the given params', async () => {
    await useCase.updateTaxClass('c1', { name: 'Reduced' });

    expect(adminRepo.updateTaxClass).toHaveBeenCalledWith('c1', { name: 'Reduced' });
  });

  it('should soft delete a tax class', async () => {
    await useCase.softDeleteTaxClass('c1');

    expect(adminRepo.softDeleteTaxClass).toHaveBeenCalledWith('c1');
  });
});
