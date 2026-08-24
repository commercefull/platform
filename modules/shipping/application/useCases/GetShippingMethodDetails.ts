import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';

const shippingMethodRepo = shippingConfigRepository.methods;
const shippingRateRepo = shippingConfigRepository.rates;

export class GetShippingMethodDetailsUseCase {
  async getShippingMethod(shippingMethodId: string) {
    if (!shippingMethodId) {
      const defaultMethod = await shippingMethodRepo.findDefault();
      if (defaultMethod) {
        const rates = await shippingRateRepo.findByMethod(defaultMethod.shippingMethodId, true);
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

    const method = await shippingMethodRepo.findById(shippingMethodId);
    if (!method) {
      return { cost: '0.00', name: 'Standard Shipping' };
    }

    const rates = await shippingRateRepo.findByMethod(shippingMethodId, true);
    const rate = rates.length > 0 ? rates[0] : null;

    return {
      shippingMethodId: method.shippingMethodId,
      name: method.name,
      cost: rate?.baseRate || '0.00',
      estimatedDeliveryDays: method.estimatedDeliveryDays,
    };
  }
}
