import type { ShippingSurcharge } from '../../../../libs/db/types';

export interface ShippingSurchargePort {
  findActiveByRateId(shippingRateId: string): Promise<ShippingSurcharge[]>;
}
