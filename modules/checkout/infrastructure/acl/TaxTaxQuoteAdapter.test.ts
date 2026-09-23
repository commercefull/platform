import { TaxTaxQuoteAdapter } from './TaxTaxQuoteAdapter';
import type { CalculateOrderTaxUseCase } from '../../../tax/application/useCases/CalculateOrderTax';
import type taxSettingsRepoModule from '../../../tax/infrastructure/repositories/taxSettingsRepo';

describe('TaxTaxQuoteAdapter', () => {
  let adapter: TaxTaxQuoteAdapter;
  let calculateOrderTaxUseCase: jest.Mocked<Pick<CalculateOrderTaxUseCase, 'execute'>>;
  let taxSettingsRepo: jest.Mocked<Pick<typeof taxSettingsRepoModule, 'findByMerchant'>>;

  beforeEach(() => {
    calculateOrderTaxUseCase = { execute: jest.fn() };
    taxSettingsRepo = { findByMerchant: jest.fn() };
    adapter = new TaxTaxQuoteAdapter(calculateOrderTaxUseCase, taxSettingsRepo);
  });

  it('implements TaxQuotePort', () => {
    expect(typeof adapter.calculateTax).toBe('function');
    expect(typeof adapter.getTaxSettings).toBe('function');
  });

  it('should map tax calculation result to checkout vocabulary', async () => {
    calculateOrderTaxUseCase.execute.mockResolvedValue({
      success: true,
      subtotal: 100,
      shippingAmount: 10,
      taxAmount: 8.5,
      total: 118.5,
      taxRate: 0.085,
      lineItems: [],
    });

    const result = await adapter.calculateTax({
      items: [{ productId: 'p1', name: 'Widget', quantity: 1, unitPrice: 100 }],
      shippingAddress: { country: 'US', region: 'OR' },
      shippingAmount: 10,
    });

    expect(result.success).toBe(true);
    expect(result.taxAmount).toBe(8.5);
  });

  it('should return taxAmount 0 when calculation fails', async () => {
    calculateOrderTaxUseCase.execute.mockResolvedValue({
      success: false,
      subtotal: 0,
      shippingAmount: 0,
      taxAmount: 0,
      total: 0,
      taxRate: 0,
      lineItems: [],
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
      taxSettingsId: 'ts-1',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      organizationId: 'merchant-1',
      calculationMethod: 'itemBased',
      pricesIncludeTax: false,
      displayPricesWithTax: false,
      taxBasedOn: 'shippingAddress',
      displayTaxTotals: 'itemized',
      applyTaxToShipping: false,
      applyDiscountBeforeTax: true,
      roundTaxAtSubtotal: false,
      taxDecimalPlaces: 2,
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
