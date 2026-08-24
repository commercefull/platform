/**
 * Unit Tests for TaxRate Entity
 */

import { TaxRate } from './TaxRate';

describe('TaxRate', () => {
  describe('create', () => {
    it('should create with active status', () => {
      const rate = TaxRate.create({
        taxRateId: 'rate-1',
        name: 'US Federal',
        code: 'US_FED',
        type: 'percentage',
        rate: 10,
        country: 'US',
        isCompound: false,
        isShippingTaxed: false,
        priority: 1,
      });

      expect(rate.taxRateId).toBe('rate-1');
      expect(rate.name).toBe('US Federal');
      expect(rate.rate).toBe(10);
      expect(rate.country).toBe('US');
      expect(rate.isActive).toBe(true);
    });

    it('should create with fixed type', () => {
      const rate = TaxRate.create({
        taxRateId: 'rate-2',
        name: 'Flat Fee',
        code: 'FLAT',
        type: 'fixed',
        rate: 5,
        country: 'US',
        isCompound: false,
        isShippingTaxed: false,
        priority: 1,
      });

      expect(rate.calculateTax(100)).toBe(5);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const rate = TaxRate.reconstitute({
        taxRateId: 'rate-1',
        name: 'State Tax',
        code: 'OR_STATE',
        type: 'percentage',
        rate: 7.5,
        country: 'US',
        state: 'OR',
        isCompound: false,
        isShippingTaxed: true,
        priority: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(rate.name).toBe('State Tax');
      expect(rate.rate).toBe(7.5);
    });
  });

  describe('calculateTax', () => {
    it('should calculate percentage tax correctly', () => {
      const rate = TaxRate.create({
        taxRateId: 'rate-1',
        name: '10% Tax',
        code: 'TEN',
        type: 'percentage',
        rate: 10,
        country: 'US',
        isCompound: false,
        isShippingTaxed: false,
        priority: 1,
      });

      expect(rate.calculateTax(100)).toBe(10);
      expect(rate.calculateTax(50)).toBe(5);
    });

    it('should return 0 when inactive', () => {
      const rate = TaxRate.reconstitute({
        taxRateId: 'rate-1',
        name: 'Inactive',
        code: 'INACT',
        type: 'percentage',
        rate: 10,
        country: 'US',
        isCompound: false,
        isShippingTaxed: false,
        priority: 1,
        isActive: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(rate.calculateTax(100)).toBe(0);
    });
  });

  describe('isApplicable', () => {
    it('should match by country', () => {
      const rate = TaxRate.create({
        taxRateId: 'rate-1',
        name: 'US Tax',
        code: 'US',
        type: 'percentage',
        rate: 10,
        country: 'US',
        isCompound: false,
        isShippingTaxed: false,
        priority: 1,
      });

      expect(rate.isApplicable('US')).toBe(true);
      expect(rate.isApplicable('CA')).toBe(false);
    });

    it('should match by country and state', () => {
      const rate = TaxRate.reconstitute({
        taxRateId: 'rate-1',
        name: 'OR Tax',
        code: 'OR',
        type: 'percentage',
        rate: 7.5,
        country: 'US',
        state: 'OR',
        isCompound: false,
        isShippingTaxed: false,
        priority: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(rate.isApplicable('US', 'OR')).toBe(true);
      expect(rate.isApplicable('US', 'WA')).toBe(false);
    });

    it('should match by postal code when postalCodes are defined', () => {
      const rate = TaxRate.reconstitute({
        taxRateId: 'rate-1',
        name: 'Portland',
        code: 'PDX',
        type: 'percentage',
        rate: 8,
        country: 'US',
        state: 'OR',
        postalCodes: ['97201', '97202'],
        isCompound: false,
        isShippingTaxed: false,
        priority: 1,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(rate.isApplicable('US', 'OR', '97201')).toBe(true);
      expect(rate.isApplicable('US', 'OR', '97209')).toBe(false);
    });

    it('should return false when inactive', () => {
      const rate = TaxRate.reconstitute({
        taxRateId: 'rate-1',
        name: 'Inactive',
        code: 'INACT',
        type: 'percentage',
        rate: 10,
        country: 'US',
        isCompound: false,
        isShippingTaxed: false,
        priority: 1,
        isActive: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(rate.isApplicable('US')).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return serialized object', () => {
      const rate = TaxRate.create({
        taxRateId: 'rate-1',
        name: 'Test',
        code: 'TEST',
        type: 'percentage',
        rate: 5,
        country: 'US',
        isCompound: false,
        isShippingTaxed: false,
        priority: 1,
      });

      const json = rate.toJSON();

      expect(json.taxRateId).toBe('rate-1');
      expect(json.name).toBe('Test');
      expect(json.rate).toBe(5);
    });
  });
});
