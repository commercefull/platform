/* eslint-disable @typescript-eslint/no-require-imports */

describe('PromotionPromotionQuoteAdapter', () => {
  let adapter: import('./PromotionPromotionQuoteAdapter').PromotionPromotionQuoteAdapter;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../../promotion/application/services/PromotionEvaluationService', () => ({
      promotionEvaluationService: { evaluate: jest.fn() },
    }));
    const { PromotionPromotionQuoteAdapter } = require('./PromotionPromotionQuoteAdapter');
    adapter = new PromotionPromotionQuoteAdapter();
  });

  afterEach(() => {
    jest.dontMock('../../../promotion/application/services/PromotionEvaluationService');
  });

  it('implements PromotionQuotePort', () => {
    expect(typeof adapter.evaluatePromotions).toBe('function');
  });

  it('should map promotion evaluation result to checkout vocabulary', async () => {
    const { promotionEvaluationService } = require('../../../promotion/application/services/PromotionEvaluationService');
    promotionEvaluationService.evaluate.mockResolvedValue({
      totalDiscountAmount: 15,
      appliedPromotions: [
        { promotionId: 'promo-1', name: 'Summer Sale', discountAmount: 10 },
        { promotionId: 'promo-2', name: 'Loyalty', discountAmount: 5 },
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
    const { promotionEvaluationService } = require('../../../promotion/application/services/PromotionEvaluationService');
    promotionEvaluationService.evaluate.mockResolvedValue({
      totalDiscountAmount: 0,
      appliedPromotions: null,
    });

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
    const { promotionEvaluationService } = require('../../../promotion/application/services/PromotionEvaluationService');
    promotionEvaluationService.evaluate.mockRejectedValue(new Error('Service error'));

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
