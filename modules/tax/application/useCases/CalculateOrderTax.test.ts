/**
 * Unit Tests for CalculateOrderTax Use Case
 */

jest.mock('../../infrastructure/repositories/TaxQueryRepository', () => ({
  __esModule: true,
  default: {
    query: {
      getTaxRateForAddress: jest.fn(),
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
    jest.mocked(taxQueryRepository.query.findCustomerTaxExemptions).mockResolvedValue([]);
  });

  it('should calculate tax for order items', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand(
        [{ productId: 'p-1', name: 'Widget', quantity: 2, unitPrice: 50 }],
        { country: 'US', state: 'OR' },
        10,
      ),
    );

    expect(result.success).toBe(true);
    expect(result.subtotal).toBe(100);
    expect(result.taxAmount).toBe(11); // 100 * 10% + 10 * 10%
    expect(result.total).toBe(121); // 100 + 10 + 11
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].taxAmount).toBe(10);
  });

  it('should return failure when no items', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand([], { country: 'US' }, 10),
    );

    expect(result.success).toBe(false);
    expect(result.message).toBe('No items to calculate tax for');
  });

  it('should return failure when country is missing', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand(
        [{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 50 }],
        { country: '' },
      ),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('country is required');
  });

  it('should skip tax for non-taxable items', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand(
        [{ productId: 'p-1', name: 'Gift Card', quantity: 1, unitPrice: 50, taxable: false }],
        { country: 'US' },
      ),
    );

    expect(result.success).toBe(true);
    expect(result.lineItems[0].taxAmount).toBe(0);
    expect(result.lineItems[0].taxRate).toBe(0);
  });

  it('should apply tax exemption for customer', async () => {
    jest.mocked(taxQueryRepository.query.findCustomerTaxExemptions).mockResolvedValue([
      {} as CustomerTaxExemption,
    ]);

    const result = await useCase.execute(
      new CalculateOrderTaxCommand(
        [{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }],
        { country: 'US' },
        0,
        'cust-1',
      ),
    );

    expect(result.success).toBe(true);
    expect(result.taxAmount).toBe(0);
    expect(result.message).toBe('Customer is tax exempt');
  });

  it('should calculate shipping tax', async () => {
    const result = await useCase.execute(
      new CalculateOrderTaxCommand(
        [{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }],
        { country: 'US' },
        20,
      ),
    );

    expect(result.success).toBe(true);
    expect(result.taxAmount).toBe(12); // 100 * 10% + 20 * 10%
  });

  it('should return fallback on error', async () => {
    jest.mocked(taxQueryRepository.query.getTaxRateForAddress).mockRejectedValue(new Error('DB error'));

    const result = await useCase.execute(
      new CalculateOrderTaxCommand(
        [{ productId: 'p-1', name: 'Widget', quantity: 1, unitPrice: 100 }],
        { country: 'US' },
      ),
    );

    expect(result.success).toBe(false);
    expect(result.taxAmount).toBe(0);
    expect(result.message).toContain('DB error');
  });
});
