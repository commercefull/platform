import { PromotionPromotionQuoteAdapter } from './PromotionPromotionQuoteAdapter';
import type { PromotionEvaluationService, PromotionEvaluationResult } from '../../../promotion/application/services/PromotionEvaluationService';

describe('PromotionPromotionQuoteAdapter', () => {
  let adapter: PromotionPromotionQuoteAdapter;
  let evaluationService: jest.Mocked<Pick<PromotionEvaluationService, 'evaluate'>>;

  beforeEach(() => {
    evaluationService = { evaluate: jest.fn() };
    adapter = new PromotionPromotionQuoteAdapter(evaluationService as unknown as PromotionEvaluationService);
  });

  it('should implement PromotionQuotePort', () => {
    expect(typeof adapter.evaluatePromotions).toBe('function');
  });

  it('should map promotion evaluation result to checkout vocabulary', async () => {
    evaluationService.evaluate.mockResolvedValue({
      totalDiscountAmount: 15,
      shippingDiscountAmount: 0,
      freeShipping: false,
      lineItemDiscounts: [],
      freeItems: [],
      appliedPromotions: [
        { promotionId: 'promo-1', name: 'Summer Sale', type: 'cart', discountAmount: 10 },
        { promotionId: 'promo-2', name: 'Loyalty', type: 'cart', discountAmount: 5 },
      ],
    });

    const result = await adapter.evaluatePromotions({
      items: [{ productId: 'p1', name: 'Widget', quantity: 1, unitPrice: 100, isDigital: false }],
      subtotal: 100,
      shippingAmount: 10,
      currency: 'USD',
    });

    expect(result.totalDiscountAmount).toBe(15);
    expect(result.appliedPromotions).toHaveLength(2);
    expect(result.appliedPromotions[0].id).toBe('promo-1');
    expect(result.appliedPromotions[0].name).toBe('Summer Sale');
    expect(result.appliedPromotions[0].amount).toBe(10);
  });

  it('should handle empty appliedPromotions', async () => {
    evaluationService.evaluate.mockResolvedValue({
      totalDiscountAmount: 0,
      shippingDiscountAmount: 0,
      freeShipping: false,
      lineItemDiscounts: [],
      freeItems: [],
      appliedPromotions: null,
    } as unknown as PromotionEvaluationResult);

    const result = await adapter.evaluatePromotions({
      items: [],
      subtotal: 0,
      shippingAmount: 0,
      currency: 'USD',
    });

    expect(result.totalDiscountAmount).toBe(0);
    expect(result.appliedPromotions).toEqual([]);
  });

  it('should return zero discount when evaluation throws', async () => {
    evaluationService.evaluate.mockRejectedValue(new Error('Service error'));

    const result = await adapter.evaluatePromotions({
      items: [],
      subtotal: 0,
      shippingAmount: 0,
      currency: 'USD',
    });

    expect(result.totalDiscountAmount).toBe(0);
    expect(result.appliedPromotions).toEqual([]);
  });
});
