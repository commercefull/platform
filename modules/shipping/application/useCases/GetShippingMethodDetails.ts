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
          cost: rate?.baseRate || '0.00',
          estimatedDeliveryDays: defaultMethod.estimatedDeliveryDays,
        };
      }
      return { cost: '0.00', name: 'Standard Shipping' };
    }

    const method = await this.shippingMethodRepo.findById(shippingMethodId);
    if (!method) {
      return { cost: '0.00', name: 'Standard Shipping' };
    }

    const rates = await this.shippingRateRepo.findByMethod(shippingMethodId, true);
    const rate = rates.length > 0 ? rates[0] : null;

    return {
      shippingMethodId: method.shippingMethodId,
      name: method.name,
      cost: rate?.baseRate || '0.00',
      estimatedDeliveryDays: method.estimatedDeliveryDays,
    };
  }
}
