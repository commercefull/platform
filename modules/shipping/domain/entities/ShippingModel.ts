/**
 * Database record types — match the generated libs/db/types schema.
 * Kept in domain so repository ports do not depend on the database layer.
 */

export type ShippingCarrier = {
  shippingCarrierId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  code: string;
  description: string | null;
  websiteUrl: string | null;
  trackingUrl: string | null;
  isActive: boolean;
  accountNumber: string | null;
  apiCredentials: unknown | null;
  supportedRegions: unknown | null;
  supportedServices: unknown | null;
  requiresContract: boolean;
  hasApiIntegration: boolean;
  customFields: unknown | null;
  createdBy: string | null;
}

export type ShippingMethodRecord = {
  shippingMethodId: string;
  createdAt: Date;
  updatedAt: Date;
  shippingCarrierId: string | null;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  serviceCode: string | null;
  domesticInternational: string;
  estimatedDeliveryDays: unknown | null;
  handlingDays: number | null;
  priority: number | null;
  displayOnFrontend: boolean;
  allowFreeShipping: boolean;
  minWeight: string | null;
  maxWeight: string | null;
  minOrderValueCents: number | null;
  maxOrderValueCents: number | null;
  dimensionRestrictions: unknown | null;
  shippingClass: string | null;
  customFields: unknown | null;
  createdBy: string | null;
}

export type ShippingZoneRecord = {
  shippingZoneId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number | null;
  locationType: string;
  locations: unknown;
  excludedLocations: unknown | null;
  createdBy: string | null;
}

export type ShippingRateRecord = {
  shippingRateId: string;
  createdAt: Date;
  updatedAt: Date;
  shippingZoneId: string;
  shippingMethodId: string;
  name: string | null;
  description: string | null;
  isActive: boolean;
  rateType: string;
  baseRateCents: number;
  perItemRateCents: number | null;
  freeThresholdCents: number | null;
  rateMatrix: unknown | null;
  minRateCents: number | null;
  maxRateCents: number | null;
  currencyCode: string;
  taxable: boolean;
  priority: number | null;
  validFrom: Date | null;
  validTo: Date | null;
  conditions: unknown | null;
  createdBy: string | null;
}

export type ShippingSurchargeRecord = {
  shippingSurchargeId: string;
  createdAt: Date;
  updatedAt: Date;
  shippingRateId: string;
  type: string;
  calculationType: string;
  value: string;
  conditions: unknown | null;
  isActive: boolean;
}

export type ShippingPackagingTypeRecord = {
  shippingPackagingTypeId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  weight: string;
  length: string;
  width: string;
  height: string;
  volume: string;
  maxWeight: string | null;
  maxItems: number | null;
  costCents: number | null;
  currencyCode: string;
  recyclable: boolean;
  imageUrl: string | null;
  validCarriers: string[] | null;
  createdBy: string | null;
}

