import type { ShippingSurchargeRecord as ShippingSurcharge } from '../entities/ShippingModel';

export type CreateShippingSurchargeInput = Omit<ShippingSurcharge, 'shippingSurchargeId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingSurchargeInput = Partial<Omit<ShippingSurcharge, 'shippingSurchargeId' | 'createdAt' | 'updatedAt'>>;

export interface ShippingSurchargePort {
  findActiveByRateId(shippingRateId: string): Promise<ShippingSurcharge[]>;
}

export interface ShippingSurchargeAdminPort extends ShippingSurchargePort {
  findByRateId(shippingRateId: string, activeOnly?: boolean): Promise<ShippingSurcharge[]>;
  findById(shippingSurchargeId: string): Promise<ShippingSurcharge | null>;
  create(input: CreateShippingSurchargeInput): Promise<ShippingSurcharge>;
  update(shippingSurchargeId: string, input: UpdateShippingSurchargeInput): Promise<ShippingSurcharge | null>;
  delete(shippingSurchargeId: string): Promise<boolean>;
}
