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
import {
  extractCountryFromVat,
  formatVatNumber,
  validateVatNumberFormat,
} from '../../../tax/infrastructure/repositories/taxVatRegistrationRepo';

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
        vatNumber: request.vatNumber,
        organizationId: request.organizationId,
        originCountry: request.originCountry,
      });
      return {
        success: taxResult.success,
        taxAmountCents: taxResult.success ? taxResult.taxAmountCents : 0,
        taxAddedCents: taxResult.taxAddedCents,
        taxIncludedInSubtotal: taxResult.taxIncludedInSubtotal,
        reverseChargeApplied: taxResult.reverseChargeApplied,
      };
    } catch {
      return { success: false, taxAmountCents: 0 };
    }
  }

  validateVatNumber(vatNumber: string, countryCode?: string): boolean {
    const country = countryCode ?? extractCountryFromVat(vatNumber) ?? undefined;
    return validateVatNumberFormat(formatVatNumber(vatNumber, country), country ?? '');
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
