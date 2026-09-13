/**
 * Unit Tests for CalculateOrderTax Use Case
 */

jest.mock('../../infrastructure/repositories/TaxQueryRepository', () => ({
  __esModule: true,
  default: {
    query: {
      getTaxRateForAddress: jest.fn(),
      getTaxRateForAddressAndCategory: jest.fn(),
      findCustomerTaxExemptions: jest.fn(),
    },
  },
}));

import { CalculateOrderTaxUseCase, CalculateOrderTaxCommand } from './CalculateOrderTax';
import taxQueryRepository from '../../infrastructure/repositories/TaxQueryRepository';
import type { CustomerTaxExemption } from '../../taxTypes';

describe('CalculateOrderTaxUseCase', () => {
  let useCase: CalculateOrderTaxUseCase;

  beforeEach(() => {
    useCase = new CalculateOrderTaxUseCase();
    jest.mocked(taxQueryRepository.query.getTaxRateForAddress).mockResolvedValue(10);
    jest.mocked(taxQueryRepository.query.getTaxRateForAddressAndCategory).mockResolvedValue(0);
    jest.mocked(taxQueryRepository.query.findCustomerTaxExemptions).mockResolvedValue([]);
  });

  it('should calculate tax for order items', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 2, unitPrice: 50 }], { country: 'US', state: 'OR' }, 10),
    );

    expect(result.success).toBe(true);
    expect(result.subtotal).toBe(100);
    expect(result.taxAmount).toBe(11); // 100 * 10% + 10 * 10%
    expect(result.total).toBe(121); // 100 + 10 + 11
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].taxAmount).toBe(10);
  });

  it('should return failure when no items', async () => {
    const result = await useCase.execute(new CalculateOrderTaxCommand([], { country: 'US' }, 10));

    expect(result.success).toBe(false);
    expect(result.message).toBe('No items to calculate tax for');
  });

  it('should return failure when country is missing', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 50 }], { country: '' }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('country is required');
  });

  it('should skip tax for non-taxable items', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Gift Card', quantity: 1, unitPrice: 50, taxable: false }], {
        country: 'US',
      }),
    );

    expect(result.success).toBe(true);
    expect(result.lineItems[0].taxAmount).toBe(0);
    expect(result.lineItems[0].taxRate).toBe(0);
  });

  it('should apply tax exemption for customer', async () => {
    jest.mocked(taxQueryRepository.query.findCustomerTaxExemptions).mockResolvedValue([
      {
        id: 'ex1',
        customerId: 'cust-1',
        type: 'resale',
        status: 'approved',
        exemptionNumber: 'EX123',
        name: 'Resale Certificate',
        startDate: Date.now(),
        isVerified: true,
        exemptionPercent: 100,
        applicableTaxCategoryIds: null,
      } as CustomerTaxExemption,
    ]);

    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }], { country: 'US' }, 0, 'cust-1'),
    );

    expect(result.success).toBe(true);
    expect(result.taxAmount).toBe(0);
    expect(result.message).toBe('Tax exemption applied');
  });

  it('should calculate shipping tax', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }], { country: 'US' }, 20),
    );

    expect(result.success).toBe(true);
    expect(result.taxAmount).toBe(12); // 100 * 10% + 20 * 10%
  });

  it('should return fallback on error', async () => {
    jest.mocked(taxQueryRepository.query.getTaxRateForAddress).mockRejectedValue(new Error('DB error'));

    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }], { country: 'US' }),
    );

    expect(result.success).toBe(false);
    expect(result.taxAmount).toBe(0);
    expect(result.message).toContain('DB error');
  });

  // ========================================================================
  // Epic B — Type-aware, category-aware, amount-bounded exemptions
  // ========================================================================

  describe('Epic B — category-scoped exemptions', () => {
    it('should exempt only matching categories in a mixed cart', async () => {
      jest.mocked(taxQueryRepository.query.findCustomerTaxExemptions).mockResolvedValue([
        {
          id: 'ex1',
          customerId: 'cust-1',
          type: 'resale',
          status: 'approved',
          exemptionNumber: 'EX123',
          name: 'Resale Certificate',
          startDate: Date.now(),
          isVerified: true,
          exemptionPercent: 100,
          applicableTaxCategoryIds: ['digital-goods'],
        } as CustomerTaxExemption,
      ]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand(
          [
            { productId: 'p-1', name: 'Physical Widget', quantity: 1, unitPrice: 100, taxCategoryId: 'physical-goods' },
            { productId: 'p-2', name: 'E-Book', quantity: 1, unitPrice: 50, taxCategoryId: 'digital-goods' },
          ],
          { country: 'US' },
          0,
          'cust-1',
        ),
      );

      expect(result.success).toBe(true);
      // Physical goods: taxed normally (100 * 10% = 10)
      expect(result.lineItems[0].taxAmount).toBe(10);
      expect(result.lineItems[0].exemptionVerdict).toBe('notExempt');
      // Digital goods: exempt (50 * 10% * 0 = 0)
      expect(result.lineItems[1].taxAmount).toBe(0);
      expect(result.lineItems[1].exemptionVerdict).toBe('exempt');
    });
  });

  describe('Epic B — partial exemption', () => {
    it('should apply 50% partial exemption', async () => {
      jest.mocked(taxQueryRepository.query.findCustomerTaxExemptions).mockResolvedValue([
        {
          id: 'ex1',
          customerId: 'cust-1',
          type: 'nonprofit',
          status: 'approved',
          exemptionNumber: 'EX123',
          name: 'Nonprofit Certificate',
          startDate: Date.now(),
          isVerified: true,
          exemptionPercent: 50,
          applicableTaxCategoryIds: null,
        } as CustomerTaxExemption,
      ]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }], { country: 'US' }, 0, 'cust-1'),
      );

      expect(result.success).toBe(true);
      // 100 * 10% * 0.5 = 5 (50% of tax is exempt)
      expect(result.lineItems[0].taxAmount).toBe(5);
      expect(result.lineItems[0].exemptionVerdict).toBe('partiallyExempt');
    });
  });

  describe('Epic B — expired exemption', () => {
    it('should not exempt when certificate has expired', async () => {
      jest.mocked(taxQueryRepository.query.findCustomerTaxExemptions).mockResolvedValue([
        {
          id: 'ex1',
          customerId: 'cust-1',
          type: 'resale',
          status: 'approved',
          exemptionNumber: 'EX123',
          name: 'Resale Certificate',
          startDate: Date.now() - 86400000 * 365,
          expiryDate: Date.now() - 86400000, // expired yesterday
          isVerified: true,
          exemptionPercent: 100,
          applicableTaxCategoryIds: null,
        } as CustomerTaxExemption,
      ]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }], { country: 'US' }, 0, 'cust-1'),
      );

      expect(result.success).toBe(true);
      // Expired exemption → full tax applies
      expect(result.lineItems[0].taxAmount).toBe(10);
      expect(result.lineItems[0].exemptionVerdict).toBe('notExempt');
    });
  });

  describe('Epic B — pending exemption', () => {
    it('should not exempt when exemption is pending approval', async () => {
      jest.mocked(taxQueryRepository.query.findCustomerTaxExemptions).mockResolvedValue([
        {
          id: 'ex1',
          customerId: 'cust-1',
          type: 'resale',
          status: 'pending',
          exemptionNumber: 'EX123',
          name: 'Resale Certificate',
          startDate: Date.now(),
          isVerified: false,
          exemptionPercent: 100,
          applicableTaxCategoryIds: null,
        } as CustomerTaxExemption,
      ]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }], { country: 'US' }, 0, 'cust-1'),
      );

      expect(result.success).toBe(true);
      // Pending exemption → full tax applies
      expect(result.lineItems[0].taxAmount).toBe(10);
    });
  });

  describe('Epic B — per-category rate lookup', () => {
    it('should use category-specific rate when taxCategoryId is set', async () => {
      jest.mocked(taxQueryRepository.query.getTaxRateForAddressAndCategory).mockResolvedValue(5);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Book', quantity: 1, unitPrice: 100, taxCategoryId: 'books' }], {
          country: 'US',
        }),
      );

      expect(result.success).toBe(true);
      // Category-specific rate 5% instead of default 10%
      expect(result.lineItems[0].taxAmount).toBe(5);
      expect(taxQueryRepository.query.getTaxRateForAddressAndCategory).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'US' }),
        'books',
      );
    });

    it('should fall back to default rate when category-specific rate is zero', async () => {
      jest.mocked(taxQueryRepository.query.getTaxRateForAddressAndCategory).mockResolvedValue(0);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Book', quantity: 1, unitPrice: 100, taxCategoryId: 'books' }], {
          country: 'US',
        }),
      );

      expect(result.success).toBe(true);
      // No category-specific rate → use default 10%
      expect(result.lineItems[0].taxAmount).toBe(10);
    });
  });

  describe('Epic B — amount-bounded exemption', () => {
    it('should not exempt when order subtotal is below minOrderAmount', async () => {
      jest.mocked(taxQueryRepository.query.findCustomerTaxExemptions).mockResolvedValue([
        {
          id: 'ex1',
          customerId: 'cust-1',
          type: 'resale',
          status: 'approved',
          exemptionNumber: 'EX123',
          name: 'Resale Certificate',
          startDate: Date.now(),
          isVerified: true,
          exemptionPercent: 100,
          applicableTaxCategoryIds: null,
          minOrderAmount: 500,
        } as CustomerTaxExemption,
      ]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }], { country: 'US' }, 0, 'cust-1'),
      );

      // Order subtotal 100 < minOrderAmount 500 → not exempt
      expect(result.lineItems[0].taxAmount).toBe(10);
      expect(result.lineItems[0].exemptionVerdict).toBe('notExempt');
    });

    it('should exempt when order subtotal meets minOrderAmount', async () => {
      jest.mocked(taxQueryRepository.query.findCustomerTaxExemptions).mockResolvedValue([
        {
          id: 'ex1',
          customerId: 'cust-1',
          type: 'resale',
          status: 'approved',
          exemptionNumber: 'EX123',
          name: 'Resale Certificate',
          startDate: Date.now(),
          isVerified: true,
          exemptionPercent: 100,
          applicableTaxCategoryIds: null,
          minOrderAmount: 50,
        } as CustomerTaxExemption,
      ]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }], { country: 'US' }, 0, 'cust-1'),
      );

      // Order subtotal 100 >= minOrderAmount 50 → exempt
      expect(result.lineItems[0].taxAmount).toBe(0);
      expect(result.lineItems[0].exemptionVerdict).toBe('exempt');
    });
  });
});
