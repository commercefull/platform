/**
 * Shipping Configuration Repository Ports
 *
 * Domain-facing slice interfaces for the shipping configuration aggregate
 * (carriers, methods, zones, rates). Concrete implementations live in
 * infrastructure/repositories and are injected via application/wired.ts.
 */

import type { ShippingCarrier, ShippingMethod, ShippingZone, ShippingRate } from '../../../../libs/db/types';

export type CreateShippingCarrierInput = Omit<ShippingCarrier, 'shippingCarrierId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingCarrierInput = Partial<Omit<ShippingCarrier, 'shippingCarrierId' | 'code' | 'createdAt' | 'updatedAt'>>;
export type CreateShippingMethodInput = Omit<ShippingMethod, 'shippingMethodId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingMethodInput = Partial<Omit<ShippingMethod, 'shippingMethodId' | 'createdAt' | 'updatedAt'>>;
export type CreateShippingZoneInput = Omit<ShippingZone, 'shippingZoneId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingZoneInput = Partial<Omit<ShippingZone, 'shippingZoneId' | 'createdAt' | 'updatedAt'>>;
export type CreateShippingRateInput = Omit<ShippingRate, 'shippingRateId' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingRateInput = Partial<Omit<ShippingRate, 'shippingRateId' | 'createdAt' | 'updatedAt'>>;

export interface ShippingCarrierPort {
  findById(id: string): Promise<ShippingCarrier | null>;
  findByCode(code: string): Promise<ShippingCarrier | null>;
}

export interface ShippingMethodPort {
  findById(id: string): Promise<ShippingMethod | null>;
  findByCode(code: string): Promise<ShippingMethod | null>;
  findByCarrier(carrierId: string, activeOnly?: boolean): Promise<ShippingMethod[]>;
  findAll(activeOnly?: boolean, displayOnFrontend?: boolean): Promise<ShippingMethod[]>;
  findDefault(): Promise<ShippingMethod | null>;
  create(input: CreateShippingMethodInput): Promise<ShippingMethod>;
  update(id: string, input: UpdateShippingMethodInput): Promise<ShippingMethod | null>;
  activate(id: string): Promise<ShippingMethod | null>;
  deactivate(id: string): Promise<ShippingMethod | null>;
  delete(id: string): Promise<boolean>;
}

export interface ShippingZonePort {
  findById(id: string): Promise<ShippingZone | null>;
  findAll(activeOnly?: boolean): Promise<ShippingZone[]>;
  findByLocation(country: string, state?: string): Promise<ShippingZone[]>;
  create(input: CreateShippingZoneInput): Promise<ShippingZone>;
  update(id: string, input: UpdateShippingZoneInput): Promise<ShippingZone | null>;
  activate(id: string): Promise<ShippingZone | null>;
  deactivate(id: string): Promise<ShippingZone | null>;
  delete(id: string): Promise<boolean>;
}

export interface ShippingRatePort {
  findById(id: string): Promise<ShippingRate | null>;
  findActive(zoneId?: string, methodId?: string): Promise<ShippingRate[]>;
  findByMethod(methodId: string, activeOnly?: boolean): Promise<ShippingRate[]>;
  findByZoneAndMethod(zoneId: string, methodId: string): Promise<ShippingRate | null>;
  create(input: CreateShippingRateInput): Promise<ShippingRate>;
  update(id: string, input: Record<string, unknown>): Promise<ShippingRate | null>;
  activate(id: string): Promise<ShippingRate | null>;
  deactivate(id: string): Promise<ShippingRate | null>;
  delete(id: string): Promise<boolean>;
}
