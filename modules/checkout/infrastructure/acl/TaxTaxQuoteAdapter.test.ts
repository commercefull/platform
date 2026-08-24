/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

jest.mock('../../../tax/application/useCases/CalculateOrderTax', () => ({
  __esModule: true,
  calculateOrderTaxUseCase: { execute: jest.fn() },
}));

jest.mock('../../../tax/infrastructure/repositories/taxSettingsRepo', () => ({
  __esModule: true,
  default: { findByMerchant: jest.fn() },
}));

import { TaxTaxQuoteAdapter } from './TaxTaxQuoteAdapter';

describe('TaxTaxQuoteAdapter', () => {
  let adapter: TaxTaxQuoteAdapter;
   
  let calculateOrderTaxUseCase: any;
   
  let taxSettingsRepo: any;

  beforeEach(() => {
    calculateOrderTaxUseCase = require('../../../tax/application/useCases/CalculateOrderTax').calculateOrderTaxUseCase;
    taxSettingsRepo = require('../../../tax/infrastructure/repositories/taxSettingsRepo').default;
    adapter = new TaxTaxQuoteAdapter();
  });

  it('implements TaxQuotePort', () => {
    expect(typeof adapter.calculateTax).toBe('function');
    expect(typeof adapter.getTaxSettings).toBe('function');
  });

  it('should map tax calculation result to checkout vocabulary', async () => {
    calculateOrderTaxUseCase.execute.mockResolvedValue({
      success: true,
      taxAmount: 8.50,
    });

    const result = await adapter.calculateTax({
      items: [{ productId: 'p1', name: 'Widget', quantity: 1, unitPrice: 100 }],
      shippingAddress: { country: 'US', region: 'OR' },
      shippingAmount: 10,
    });

    expect(result.success).toBe(true);
    expect(result.taxAmount).toBe(8.50);
  });

  it('should return taxAmount 0 when calculation fails', async () => {
    calculateOrderTaxUseCase.execute.mockResolvedValue({
      success: false,
      taxAmount: 0,
    });

    const result = await adapter.calculateTax({
      items: [],
      shippingAddress: { country: 'US' },
      shippingAmount: 0,
    });

    expect(result.success).toBe(false);
    expect(result.taxAmount).toBe(0);
  });

  it('should return failure result when use case throws', async () => {
    calculateOrderTaxUseCase.execute.mockRejectedValue(new Error('Tax service down'));

    const result = await adapter.calculateTax({
      items: [],
      shippingAddress: { country: 'US' },
      shippingAmount: 0,
    });

    expect(result.success).toBe(false);
    expect(result.taxAmount).toBe(0);
  });

  it('should map tax settings to checkout vocabulary', async () => {
    taxSettingsRepo.findByMerchant.mockResolvedValue({
      applyDiscountBeforeTax: true,
      applyTaxToShipping: false,
    });

    const result = await adapter.getTaxSettings('merchant-1');

    expect(result).not.toBeNull();
    expect(result!.applyDiscountBeforeTax).toBe(true);
    expect(result!.applyTaxToShipping).toBe(false);
  });

  it('should return null when tax settings not found', async () => {
    taxSettingsRepo.findByMerchant.mockResolvedValue(null);

    const result = await adapter.getTaxSettings('merchant-1');

    expect(result).toBeNull();
  });

  it('should return null when tax settings repo throws', async () => {
    taxSettingsRepo.findByMerchant.mockRejectedValue(new Error('DB error'));

    const result = await adapter.getTaxSettings('merchant-1');

    expect(result).toBeNull();
  });
});
