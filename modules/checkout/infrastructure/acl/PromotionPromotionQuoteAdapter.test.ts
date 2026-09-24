import { PromotionPromotionQuoteAdapter } from './PromotionPromotionQuoteAdapter';
import type {
  EvaluatePromotionsUseCase,
  PromotionEvaluationResult,
} from '../../../promotion/application/useCases/EvaluatePromotions';

describe('PromotionPromotionQuoteAdapter', () => {
  let adapter: PromotionPromotionQuoteAdapter;
  let evaluatePromotions: jest.Mocked<Pick<EvaluatePromotionsUseCase, 'execute'>>;

  beforeEach(() => {
    evaluatePromotions = { execute: jest.fn() };
    adapter = new PromotionPromotionQuoteAdapter(evaluatePromotions);
  });

  it('should implement PromotionQuotePort', () => {
    expect(typeof adapter.evaluatePromotions).toBe('function');
  });

  it('should map promotion evaluation result to checkout vocabulary', async () => {
    evaluatePromotions.execute.mockResolvedValue({
      totalDiscountAmountCents: 15,
      shippingDiscountAmountCents: 0,
      freeShipping: false,
      lineItemDiscounts: [],
      freeItems: [],
      appliedPromotions: [
        { promotionId: 'promo-1', name: 'Summer Sale', type: 'cart', discountAmountCents: 10 },
        { promotionId: 'promo-2', name: 'Loyalty', type: 'cart', discountAmountCents: 5 },
      ],
    });

    const result = await adapter.evaluatePromotions({
      items: [{ productId: 'p1', name: 'Widget', quantity: 1, unitPriceCents: 100, isDigital: false }],
      subtotalCents: 100,
      shippingAmountCents: 10,
      currency: 'USD',
    });

    expect(result.totalDiscountAmountCents).toBe(15);
    expect(result.appliedPromotions).toHaveLength(2);
    expect(result.appliedPromotions[0].id).toBe('promo-1');
    expect(result.appliedPromotions[0].name).toBe('Summer Sale');
    expect(result.appliedPromotions[0].amountCents).toBe(10);
  });

  it('should handle empty appliedPromotions', async () => {
    evaluatePromotions.execute.mockResolvedValue({
      totalDiscountAmountCents: 0,
      shippingDiscountAmountCents: 0,
      freeShipping: false,
      lineItemDiscounts: [],
      freeItems: [],
      appliedPromotions: null,
    } as unknown as PromotionEvaluationResult);

    const result = await adapter.evaluatePromotions({
      items: [],
      subtotalCents: 0,
      shippingAmountCents: 0,
      currency: 'USD',
    });

    expect(result.totalDiscountAmountCents).toBe(0);
    expect(result.appliedPromotions).toEqual([]);
  });

  it('should return zero discount when evaluation throws', async () => {
    evaluatePromotions.execute.mockRejectedValue(new Error('Service error'));

    const result = await adapter.evaluatePromotions({
      items: [],
      subtotalCents: 0,
      shippingAmountCents: 0,
      currency: 'USD',
    });

    expect(result.totalDiscountAmountCents).toBe(0);
    expect(result.appliedPromotions).toEqual([]);
  });
});
