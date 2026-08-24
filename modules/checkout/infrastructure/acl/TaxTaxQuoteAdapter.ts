/**
 * TaxTaxQuoteAdapter
 *
 * ACL adapter implementing checkout's TaxQuotePort.
 * Translates tax's CalculateOrderTax use case and taxSettingsRepo
 * into checkout's TaxQuoteResult vocabulary.
 */

import { TaxQuotePort, TaxQuoteRequest, TaxQuoteResult } from '../../application/ports/TaxQuotePort';
import { calculateOrderTaxUseCase } from '../../../tax/application/useCases/CalculateOrderTax';
import taxSettingsRepo from '../../../tax/infrastructure/repositories/taxSettingsRepo';

export class TaxTaxQuoteAdapter implements TaxQuotePort {
  async calculateTax(request: TaxQuoteRequest): Promise<TaxQuoteResult> {
    try {
      const taxResult = await calculateOrderTaxUseCase.execute({
        items: request.items,
        shippingAddress: request.shippingAddress,
        shippingAmount: request.shippingAmount,
        customerId: request.customerId,
      });
      return {
        success: taxResult.success,
        taxAmount: taxResult.success ? taxResult.taxAmount : 0,
      };
    } catch {
      return { success: false, taxAmount: 0 };
    }
  }

  async getTaxSettings(merchantId: string): Promise<{ applyDiscountBeforeTax: boolean; applyTaxToShipping: boolean } | null> {
    try {
      const settings = await taxSettingsRepo.findByMerchant(merchantId);
      if (!settings) return null;
      return {
        applyDiscountBeforeTax: settings.applyDiscountBeforeTax,
        applyTaxToShipping: settings.applyTaxToShipping,
      };
    } catch {
      return null;
    }
  }
}
