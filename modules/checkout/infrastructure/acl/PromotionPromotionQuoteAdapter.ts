/**
 * PromotionPromotionQuoteAdapter
 *
 * ACL adapter implementing checkout's PromotionQuotePort.
 * Translates promotion's EvaluatePromotionsUseCase into
 * checkout's PromotionQuoteResult vocabulary.
 *
 * Breaks the singleton dependency — the adapter receives the use case
 * via constructor injection, not as a global import.
 */

import { PromotionQuotePort, PromotionQuoteRequest, PromotionQuoteResult } from '../../application/ports/PromotionQuotePort';
import type { EvaluatePromotionsUseCase } from '../../../promotion/application/useCases/EvaluatePromotions';

export class PromotionPromotionQuoteAdapter implements PromotionQuotePort {
  constructor(private readonly useCase: Pick<EvaluatePromotionsUseCase, 'execute'>) {}

  async evaluatePromotions(request: PromotionQuoteRequest): Promise<PromotionQuoteResult> {
    try {
      const result = await this.useCase.execute({
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