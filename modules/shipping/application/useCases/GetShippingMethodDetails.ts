import type { ShippingMethodPort, ShippingRatePort } from '../../domain/repositories/ShippingConfigPorts';

export class GetShippingMethodDetailsUseCase {
  constructor(
    private readonly shippingMethodRepo: Pick<ShippingMethodPort, 'findById' | 'findDefault'>,
    private readonly shippingRateRepo: Pick<ShippingRatePort, 'findByMethod'>,
  ) {}

  async getShippingMethod(shippingMethodId: string) {
    if (!shippingMethodId) {
      const defaultMethod = await this.shippingMethodRepo.findDefault();
      if (defaultMethod) {
        const rates = await this.shippingRateRepo.findByMethod(defaultMethod.shippingMethodId, true);
        const rate = rates.length > 0 ? rates[0] : null;
        return {
          shippingMethodId: defaultMethod.shippingMethodId,
          name: defaultMethod.name,
          costCents: rate ? Number(rate.baseRateCents) : 0,
          estimatedDeliveryDays: defaultMethod.estimatedDeliveryDays,
        };
      }
      return { costCents: 0, name: 'Standard Shipping' };
    }

    const method = await this.shippingMethodRepo.findById(shippingMethodId);
    if (!method) {
      return { costCents: 0, name: 'Standard Shipping' };
    }

    const rates = await this.shippingRateRepo.findByMethod(shippingMethodId, true);
    const rate = rates.length > 0 ? rates[0] : null;

    return {
      shippingMethodId: method.shippingMethodId,
      name: method.name,
      costCents: rate ? Number(rate.baseRateCents) : 0,
      estimatedDeliveryDays: method.estimatedDeliveryDays,
    };
  }
}
