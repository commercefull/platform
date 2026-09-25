/**
 * Unit Tests for CalculateOrderTax Use Case
 */

import { createTaxQueryPort, createCustomerTaxExemption } from '../../tests/testUtils';
import { CalculateOrderTaxUseCase, CalculateOrderTaxCommand } from './CalculateOrderTax';

describe('CalculateOrderTaxUseCase', () => {
  let useCase: CalculateOrderTaxUseCase;
  let taxQuery: ReturnType<typeof createTaxQueryPort>;

  beforeEach(() => {
    taxQuery = createTaxQueryPort();
    useCase = new CalculateOrderTaxUseCase(taxQuery);
  });

  it('should calculate tax on items and shipping when rates apply', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 2, unitPriceCents: 50 }], { country: 'US', state: 'OR' }, 10),
    );

    expect(result.success).toBe(true);
    expect(result.subtotalCents).toBe(100);
    expect(result.taxAmountCents).toBe(11); // 100 * 10% + 10 * 10%
    expect(result.totalCents).toBe(121);
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].taxAmountCents).toBe(10);
  });

  it('should return failure without querying rates when the order has no items', async () => {
    const result = await useCase.execute(new CalculateOrderTaxCommand([], { country: 'US' }, 10));

    expect(result.success).toBe(false);
    expect(result.message).toBe('No items to calculate tax for');
    expect(taxQuery.getTaxRateForAddress).not.toHaveBeenCalled();
  });

  it('should return failure without querying rates when the shipping country is missing', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 50 }], { country: '' }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('country is required');
    expect(taxQuery.getTaxRateForAddress).not.toHaveBeenCalled();
  });

  it('should skip tax when an item is marked non-taxable', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand(
        [{ productId: 'p-1', name: 'Gift Card', quantity: 1, unitPriceCents: 50, taxable: false }],
        { country: 'US' },
      ),
    );

    expect(result.success).toBe(true);
    expect(result.lineItems[0].taxAmountCents).toBe(0);
    expect(result.lineItems[0].taxRate).toBe(0);
  });

  it('should apply the exemption when the customer has an approved exemption', async () => {
    taxQuery.findCustomerTaxExemptions.mockResolvedValue([createCustomerTaxExemption()]);

    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 100 }], { country: 'US' }, 0, 'cust-1'),
    );

    expect(result.success).toBe(true);
    expect(result.taxAmountCents).toBe(0);
    expect(result.message).toBe('Tax exemption applied');
    expect(taxQuery.findCustomerTaxExemptions).toHaveBeenCalledWith('cust-1', 'approved');
  });

  it('should calculate tax on shipping', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 100 }], { country: 'US' }, 20),
    );

    expect(result.success).toBe(true);
    expect(result.taxAmountCents).toBe(12); // 100 * 10% + 20 * 10%
  });

  it('should return a zero-tax fallback when the repository fails', async () => {
    taxQuery.getTaxRateForAddress.mockRejectedValue(new Error('DB error'));

    const result = await useCase.execute(
      new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 100 }], { country: 'US' }),
    );

    expect(result.success).toBe(false);
    expect(result.taxAmountCents).toBe(0);
    expect(result.message).toContain('DB error');
  });

  describe('category-scoped exemptions', () => {
    it('should exempt only the matching category when the cart is mixed', async () => {
      taxQuery.findCustomerTaxExemptions.mockResolvedValue([
        createCustomerTaxExemption({ applicableTaxCategoryIds: ['digital-goods'] }),
      ]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand(
          [
            { productId: 'p-1', name: 'Physical Widget', quantity: 1, unitPriceCents: 100, taxCategoryId: 'physical-goods' },
            { productId: 'p-2', name: 'E-Book', quantity: 1, unitPriceCents: 50, taxCategoryId: 'digital-goods' },
          ],
          { country: 'US' },
          0,
          'cust-1',
        ),
      );

      expect(result.success).toBe(true);
      expect(result.lineItems[0].taxAmountCents).toBe(10); // physical: full tax
      expect(result.lineItems[0].exemptionVerdict).toBe('notExempt');
      expect(result.lineItems[1].taxAmountCents).toBe(0); // digital: exempt
      expect(result.lineItems[1].exemptionVerdict).toBe('exempt');
    });
  });

  describe('partial exemption', () => {
    it('should apply a 50% exemption when the certificate is partial', async () => {
      taxQuery.findCustomerTaxExemptions.mockResolvedValue([
        createCustomerTaxExemption({ type: 'nonprofit', exemptionPercent: 50 }),
      ]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 100 }], { country: 'US' }, 0, 'cust-1'),
      );

      expect(result.success).toBe(true);
      expect(result.lineItems[0].taxAmountCents).toBe(5); // 100 * 10% * 0.5
      expect(result.lineItems[0].exemptionVerdict).toBe('partiallyExempt');
    });
  });

  describe('expired exemption', () => {
    it('should not exempt when the certificate has expired', async () => {
      taxQuery.findCustomerTaxExemptions.mockResolvedValue([
        createCustomerTaxExemption({
          startDate: Date.now() - 86400000 * 365,
          expiryDate: Date.now() - 86400000,
        }),
      ]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 100 }], { country: 'US' }, 0, 'cust-1'),
      );

      expect(result.success).toBe(true);
      expect(result.lineItems[0].taxAmountCents).toBe(10);
      expect(result.lineItems[0].exemptionVerdict).toBe('notExempt');
    });
  });

  describe('pending exemption', () => {
    it('should not exempt when the exemption is pending approval', async () => {
      taxQuery.findCustomerTaxExemptions.mockResolvedValue([
        createCustomerTaxExemption({ status: 'pending', isVerified: false }),
      ]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 100 }], { country: 'US' }, 0, 'cust-1'),
      );

      expect(result.success).toBe(true);
      expect(result.lineItems[0].taxAmountCents).toBe(10);
    });
  });

  describe('per-category rate lookup', () => {
    it('should use the category-specific rate when the item has a taxCategoryId', async () => {
      taxQuery.getTaxRateForAddressAndCategory.mockResolvedValue(5);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand(
          [{ productId: 'p-1', name: 'Book', quantity: 1, unitPriceCents: 100, taxCategoryId: 'books' }],
          { country: 'US' },
        ),
      );

      expect(result.success).toBe(true);
      expect(result.lineItems[0].taxAmountCents).toBe(5);
      expect(taxQuery.getTaxRateForAddressAndCategory).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'US' }),
        'books',
      );
    });

    it('should fall back to the default rate when the category-specific rate is zero', async () => {
      taxQuery.getTaxRateForAddressAndCategory.mockResolvedValue(0);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand(
          [{ productId: 'p-1', name: 'Book', quantity: 1, unitPriceCents: 100, taxCategoryId: 'books' }],
          { country: 'US' },
        ),
      );

      expect(result.success).toBe(true);
      expect(result.lineItems[0].taxAmountCents).toBe(10);
    });
  });

  describe('amountCents-bounded exemption', () => {
    it('should not exempt when the order subtotalCents is below minOrderAmountCents', async () => {
      taxQuery.findCustomerTaxExemptions.mockResolvedValue([createCustomerTaxExemption({ minOrderAmountCents: 500 })]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 100 }], { country: 'US' }, 0, 'cust-1'),
      );

      expect(result.lineItems[0].taxAmountCents).toBe(10);
      expect(result.lineItems[0].exemptionVerdict).toBe('notExempt');
    });

    it('should exempt when the order subtotalCents meets minOrderAmountCents', async () => {
      taxQuery.findCustomerTaxExemptions.mockResolvedValue([createCustomerTaxExemption({ minOrderAmountCents: 50 })]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 100 }], { country: 'US' }, 0, 'cust-1'),
      );

      expect(result.lineItems[0].taxAmountCents).toBe(0);
      expect(result.lineItems[0].exemptionVerdict).toBe('exempt');
    });
  });

  describe('pricesIncludeTax', () => {
    it('should extract embedded tax instead of adding it when prices include tax', async () => {
      const result = await useCase.execute(
        new CalculateOrderTaxCommand(
          [{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 110 }],
          { country: 'US', state: 'OR' },
          0,
          undefined,
          true,
        ),
      );

      expect(result.success).toBe(true);
      expect(result.taxIncludedInSubtotal).toBe(true);
      // 110 gross at 10% -> net 100, embedded tax 10
      expect(result.lineItems[0].taxAmountCents).toBe(10);
      expect(result.taxAmountCents).toBe(10);
      // Total must not add tax again — it is already inside the price
      expect(result.totalCents).toBe(110);
    });

    it('should extract shipping tax too when prices include tax', async () => {
      const result = await useCase.execute(
        new CalculateOrderTaxCommand(
          [{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 110 }],
          { country: 'US', state: 'OR' },
          11,
          undefined,
          true,
        ),
      );

      // items: 10 embedded, shipping: 11 - 10 = 1 embedded
      expect(result.taxAmountCents).toBe(11);
      expect(result.totalCents).toBe(121);
    });

    it('should not double-charge tax on exempt inclusive items', async () => {
      taxQuery.findCustomerTaxExemptions.mockResolvedValue([createCustomerTaxExemption()]);

      const result = await useCase.execute(
        new CalculateOrderTaxCommand(
          [{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 110 }],
          { country: 'US' },
          0,
          'cust-1',
          true,
        ),
      );

      expect(result.taxAmountCents).toBe(0);
      expect(result.totalCents).toBe(110);
    });

    it('should report taxIncludedInSubtotal false for exclusive pricing', async () => {
      const result = await useCase.execute(
        new CalculateOrderTaxCommand([{ productId: 'p-1', name: 'Widget', quantity: 1, unitPriceCents: 100 }], { country: 'US' }, 0),
      );

      expect(result.success).toBe(true);
      expect(result.taxIncludedInSubtotal).toBe(false);
      expect(result.taxAmountCents).toBe(10);
      expect(result.totalCents).toBe(110);
    });
  });
});
