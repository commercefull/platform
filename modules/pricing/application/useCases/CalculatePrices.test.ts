/**
 * Unit Tests for CalculatePricesUseCase (batch price calculation)
 */

import { CalculatePricesUseCase } from './CalculatePrices';
import type { CalculatePriceUseCase } from './CalculatePrice';
import type { PricingResult } from '../../domain/pricingRule';

function createResult(priceCents: number): PricingResult {
  return {
    originalPriceCents: priceCents,
    finalPriceCents: priceCents,
    appliedRules: [],
    currency: 'USD',
  };
}

describe('CalculatePricesUseCase', () => {
  let useCase: CalculatePricesUseCase;
  let calculatePrice: jest.Mocked<Pick<CalculatePriceUseCase, 'execute'>>;

  beforeEach(() => {
    calculatePrice = { execute: jest.fn() };
    calculatePrice.execute.mockImplementation(async input => createResult(input.productId === 'p2' ? 500 : 100));
    useCase = new CalculatePricesUseCase(calculatePrice);
  });

  it('should key results by productId when no variant is given', async () => {
    const results = await useCase.execute({ items: [{ productId: 'p1' }] });

    expect(Object.keys(results)).toEqual(['p1']);
    expect(calculatePrice.execute).toHaveBeenCalledWith(expect.objectContaining({ productId: 'p1', quantity: 1 }));
  });

  it('should key results by productId:variantId when a variant is given', async () => {
    const results = await useCase.execute({ items: [{ productId: 'p1', variantId: 'v9', quantity: 3 }] });

    expect(Object.keys(results)).toEqual(['p1:v9']);
    expect(calculatePrice.execute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1', variantId: 'v9', quantity: 3 }),
    );
  });

  it('should apply the shared context to every item', async () => {
    await useCase.execute({
      items: [{ productId: 'p1' }, { productId: 'p2' }],
      context: { customerId: 'cust-1', currencyCode: 'EUR' },
    });

    expect(calculatePrice.execute).toHaveBeenCalledTimes(2);
    expect(calculatePrice.execute).toHaveBeenLastCalledWith(
      expect.objectContaining({ customerId: 'cust-1', currencyCode: 'EUR' }),
    );
  });

  it('should return an empty map for no items', async () => {
    expect(await useCase.execute({ items: [] })).toEqual({});
  });
});
