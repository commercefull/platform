/**
 * ShippingShippingQuoteAdapter
 *
 * ACL adapter implementing checkout's ShippingQuotePort.
 * Translates shipping's CalculateShippingRates use case into
 * checkout's ShippingOption[] vocabulary.
 */

import { ShippingQuotePort, ShippingOption, ShippingQuoteRequest } from '../../application/ports/ShippingQuotePort';
import { CalculateShippingRatesUseCase, CalculateShippingRatesCommand } from '../../../shipping/application/useCases/CalculateShippingRates';

export class ShippingShippingQuoteAdapter implements ShippingQuotePort {
  constructor(private readonly calculateShippingRatesUseCase?: CalculateShippingRatesUseCase) {}

  async getShippingOptions(request: ShippingQuoteRequest): Promise<ShippingOption[]> {
    if (!this.calculateShippingRatesUseCase) return [];

    try {
      const command = new CalculateShippingRatesCommand(
        {
          country: request.shippingAddress.country,
          state: request.shippingAddress.region,
          city: request.shippingAddress.city,
          postalCode: request.shippingAddress.postalCode,
        },
        {
          subtotal: request.totalValue || 0,
          itemCount: 0,
          totalWeight: request.totalWeight,
          currency: 'USD',
        },
      );
      const result = await this.calculateShippingRatesUseCase.execute(command);

      if (!result.success || !result.rates) return [];

      return result.rates.map(rate => ({
        methodId: rate.shippingMethodId,
        methodName: rate.shippingMethodName,
        amount: rate.amount,
        currency: rate.currency,
        estimatedDays: rate.estimatedDeliveryDays || undefined,
        carrier: rate.shippingCarrierId || undefined,
      }));
    } catch {
      return [];
    }
  }
}
