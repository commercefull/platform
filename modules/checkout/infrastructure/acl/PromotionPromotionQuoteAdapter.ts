/**
 * PromotionPromotionQuoteAdapter
 *
 * ACL adapter implementing checkout's PromotionQuotePort.
 * Translates promotion's PromotionEvaluationService into
 * checkout's PromotionQuoteResult vocabulary.
 *
 * Breaks the singleton dependency — the adapter receives the service
 * via constructor injection, not as a global import.
 */

import { PromotionQuotePort, PromotionQuoteRequest, PromotionQuoteResult } from '../../application/ports/PromotionQuotePort';
import { promotionEvaluationService } from '../../../promotion/application/services/PromotionEvaluationService';

export class PromotionPromotionQuoteAdapter implements PromotionQuotePort {
  async evaluatePromotions(request: PromotionQuoteRequest): Promise<PromotionQuoteResult> {
    try {
      const result = await promotionEvaluationService.evaluate({
        items: request.items,
        subtotal: request.subtotal,
        shippingAmount: request.shippingAmount,
        customerId: request.customerId,
        currency: request.currency,
        couponCode: request.couponCode,
      });

      return {
        totalDiscountAmount: result.totalDiscountAmount,
        appliedPromotions: (result.appliedPromotions || []).map(p => ({
          id: p.promotionId,
          name: p.name,
          amount: p.discountAmount,
        })),
      };
    } catch {
      return { totalDiscountAmount: 0, appliedPromotions: [] };
    }
  }
}
