/**
 * TaxSubscriptionTaxAdapter
 *
 * ACL adapter implementing subscription's SubscriptionTaxPort on top of
 * the tax module's CalculateOrderTax use case — the same quote engine
 * one-time checkout uses, so recurring pricing gets identical
 * destination/nexus/reverse-charge behavior.
 */

import type { CalculateOrderTaxUseCase } from '../../../tax/application/useCases/CalculateOrderTax';
import type { SubscriptionTaxPort, SubscriptionTaxQuote, SubscriptionTaxRequest } from '../../application/ports/SubscriptionTaxPort';

export class TaxSubscriptionTaxAdapter implements SubscriptionTaxPort {
  constructor(private readonly taxUseCase: Pick<CalculateOrderTaxUseCase, 'execute'>) {}

  async quoteSubscriptionTax(request: SubscriptionTaxRequest): Promise<SubscriptionTaxQuote> {
    try {
      const result = await this.taxUseCase.execute({
        items: request.items,
        shippingAddress: request.destination,
        shippingAmountCents: 0,
        customerId: request.customerId,
        pricesIncludeTax: false,
        vatNumber: request.vatNumber,
        organizationId: request.organizationId,
        originCountry: request.originCountry,
      });
      return {
        success: result.success,
        taxAmountCents: result.success ? result.taxAmountCents : 0,
        taxAddedCents: result.taxAddedCents,
        taxIncludedInSubtotal: result.taxIncludedInSubtotal,
        reverseChargeApplied: result.reverseChargeApplied,
      };
    } catch {
      return { success: false, taxAmountCents: 0 };
    }
  }
}
