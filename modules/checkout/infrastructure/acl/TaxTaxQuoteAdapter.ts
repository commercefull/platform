/**
 * TaxTaxQuoteAdapter
 *
 * ACL adapter implementing checkout's TaxQuotePort.
 * Translates tax's CalculateOrderTax use case and taxSettingsRepo
 * into checkout's TaxQuoteResult vocabulary.
 */

import { TaxQuotePort, TaxQuoteRequest, TaxQuoteResult } from '../../application/ports/TaxQuotePort';
import type { CalculateOrderTaxUseCase } from '../../../tax/application/useCases/CalculateOrderTax';
import type taxSettingsRepo from '../../../tax/infrastructure/repositories/taxSettingsRepo';

export class TaxTaxQuoteAdapter implements TaxQuotePort {
  constructor(
    private readonly taxUseCase: Pick<CalculateOrderTaxUseCase, 'execute'>,
    private readonly taxSettings: Pick<typeof taxSettingsRepo, 'findByMerchant'>,
  ) {}

  async calculateTax(request: TaxQuoteRequest): Promise<TaxQuoteResult> {
    try {
      const taxResult = await this.taxUseCase.execute({
        items: request.items,
        shippingAddress: request.shippingAddress,
        shippingAmountCents: request.shippingAmountCents,
        customerId: request.customerId,
        pricesIncludeTax: request.pricesIncludeTax ?? false,
      });
      return {
        success: taxResult.success,
        taxAmountCents: taxResult.success ? taxResult.taxAmountCents : 0,
        taxIncludedInSubtotal: taxResult.taxIncludedInSubtotal,
      };
    } catch {
      return { success: false, taxAmountCents: 0 };
    }
  }

  async getTaxSettings(
    merchantId: string,
  ): Promise<{ applyDiscountBeforeTax: boolean; applyTaxToShipping: boolean; pricesIncludeTax: boolean } | null> {
    try {
      const settings = await this.taxSettings.findByMerchant(merchantId);
      if (!settings) return null;
      return {
        applyDiscountBeforeTax: settings.applyDiscountBeforeTax,
        applyTaxToShipping: settings.applyTaxToShipping,
        pricesIncludeTax: settings.pricesIncludeTax,
      };
    } catch {
      return null;
    }
  }
}
