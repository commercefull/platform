import type { ShippingSurchargeRecord as ShippingSurcharge } from '../entities/ShippingModel';

export interface ShippingSurchargePort {
  findActiveByRateId(shippingRateId: string): Promise<ShippingSurcharge[]>;
}
