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
import type { PromotionEvaluationService } from '../../../promotion/application/services/PromotionEvaluationService';

export class PromotionPromotionQuoteAdapter implements PromotionQuotePort {
  constructor(private readonly promotionEvaluationService: PromotionEvaluationService) {}

  async evaluatePromotions(request: PromotionQuoteRequest): Promise<PromotionQuoteResult> {
    try {
      const result = await this.promotionEvaluationService.evaluate({
        items: request.items,
        subtotalCents: request.subtotalCents,
        shippingAmountCents: request.shippingAmountCents,
        customerId: request.customerId,
        currency: request.currency,
        couponCode: request.couponCode,
      });

      return {
        totalDiscountAmountCents: result.totalDiscountAmountCents,
        appliedPromotions: (result.appliedPromotions || []).map(p => ({
          id: p.promotionId,
          name: p.name,
          amountCents: p.discountAmountCents,
        })),
      };
    } catch {
      return { totalDiscountAmountCents: 0, appliedPromotions: [] };
    }
  }
}
