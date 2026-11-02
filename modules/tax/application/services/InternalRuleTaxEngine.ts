/**
 * InternalRuleTaxEngine — Internal Tax Engine Adapter
 *
 * Implements the `TaxEnginePort` domain port by delegating to
 * `CalculateOrderTaxUseCase` — the internal rate/zone/nexus/exemption rule
 * engine — and mapping the quote onto the persisted `TaxDecision` value
 * object. This is the seam where an external provider adapter (Avalara,
 * TaxJar) can be swapped at the composition root without touching
 * checkout/order orchestration.
 */

import { TaxEnginePort, TaxTransactionContext } from '../../domain/ports/TaxEnginePort';
import { TaxDecision, TaxDecisionLine } from '../../domain/entities/TaxDecision';
import { CalculateOrderTaxUseCase, CalculateOrderTaxCommand } from '../useCases/CalculateOrderTax';

export class InternalRuleTaxEngine implements TaxEnginePort {
  constructor(private readonly calculateOrderTax: Pick<CalculateOrderTaxUseCase, 'execute'>) {}

  async calculateQuote(context: TaxTransactionContext): Promise<TaxDecision> {
    const response = await this.calculateOrderTax.execute(
      new CalculateOrderTaxCommand({
        items: context.lines.map(line => ({
          productId: line.productId,
          name: line.name,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          taxCategoryId: line.taxCategoryId,
          taxable: line.taxable,
        })),
        shippingAddress: context.shipToAddress,
        shippingAmountCents: context.shippingAmountCents ?? 0,
        customerId: context.buyerCustomerId,
        pricesIncludeTax: context.pricesIncludeTax,
        vatNumber: context.vatNumber,
        organizationId: context.sellerOrganizationId,
        originCountry: context.shipFromAddress?.country,
        buyerType: context.buyerType,
        shipFromAddress: context.shipFromAddress,
        billToAddress: context.billToAddress,
        incoterms: context.incoterms,
        transactionTimestamp: context.transactionTimestamp,
        marketId: context.marketId,
        channelId: context.channelId,
        currencyCode: context.currencyCode,
      }),
    );

    const lineItems: TaxDecisionLine[] = response.lineItems.map(line => ({
      productId: line.productId,
      name: line.name,
      subtotalCents: line.subtotalCents,
      taxAmountCents: line.taxAmountCents,
      taxRate: line.taxRate,
      exemptionVerdict: line.exemptionVerdict,
    }));

    const jurisdictionBreakdown = [context.shipToAddress.country.toUpperCase()];

    return TaxDecision.create({
      taxRegime: response.taxRegime ?? 'NO_TAX',
      taxPolicyVersion: response.taxPolicyVersion ?? 'unknown',
      reverseChargeApplied: response.reverseChargeApplied === true,
      vatNumber: response.vatNumber,
      jurisdictionBreakdown,
      lineItems,
      taxAmountCents: response.taxAmountCents,
      taxAddedCents: response.taxAddedCents ?? response.taxAmountCents,
      taxIncludedInSubtotal: response.taxIncludedInSubtotal,
      decisionRecord: response.decisionRecord,
    });
  }
}
