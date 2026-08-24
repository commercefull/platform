/**
 * Shipping Repository Port
 *
 * Domain interface for shipping data access.
 */

export interface ShippingCarrierInfo {
  shippingCarrierId: string;
  name: string;
  code: string;
  isActive: boolean;
  supportedServices?: unknown;
  supportedRegions?: unknown;
  hasApiIntegration?: boolean;
  requiresContract?: boolean;
}

export interface ShippingMethodInfo {
  shippingMethodId: string;
  name: string;
  code: string;
  shippingCarrierId?: string;
  isActive: boolean;
  estimatedDeliveryDays?: unknown;
  handlingDays?: number;
}

export interface ShippingZoneInfo {
  shippingZoneId: string;
  name: string;
  isActive: boolean;
}

export interface ShippingRepository {
  findCarrierByCode(code: string): Promise<ShippingCarrierInfo | null>;
  findCarrierById(id: string): Promise<ShippingCarrierInfo | null>;
  findMethodByCode(code: string): Promise<ShippingMethodInfo | null>;
  findAllMethods(activeOnly?: boolean): Promise<ShippingMethodInfo[]>;
  findAllZones(activeOnly?: boolean): Promise<ShippingZoneInfo[]>;
  updateShipmentStatus(shipmentId: string, status: string): Promise<void>;
}
