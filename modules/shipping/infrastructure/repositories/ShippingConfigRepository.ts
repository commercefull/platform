/**
 * Consolidated Shipping Configuration Repository
 *
 * Merges shippingCarrierRepo, shippingMethodRepo, shippingZoneRepo,
 * shippingRateRepo, packagingTypeRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Shipping Configuration (carriers, methods, zones, rates, packaging)
 */

import shippingCarrierRepo from './shippingCarrierRepo';
import shippingMethodRepo from './shippingMethodRepo';
import shippingZoneRepo from './shippingZoneRepo';
import shippingRateRepo from './shippingRateRepo';
import packagingTypeRepo from './packagingTypeRepo';

// Re-export types for backward compatibility
export type { ShippingCarrier, CreateShippingCarrierInput, UpdateShippingCarrierInput } from './shippingCarrierRepo';
export type { ShippingMethod, CreateShippingMethodInput, UpdateShippingMethodInput } from './shippingMethodRepo';
export type { ShippingZone, CreateShippingZoneInput, UpdateShippingZoneInput } from './shippingZoneRepo';
export type { ShippingRate, CreateShippingRateInput, UpdateShippingRateInput } from './shippingRateRepo';
export type { ShippingPackagingType, CreateShippingPackagingTypeInput, UpdateShippingPackagingTypeInput } from './packagingTypeRepo';

class ShippingConfigRepository {
  readonly carriers = shippingCarrierRepo;
  readonly methods = shippingMethodRepo;
  readonly zones = shippingZoneRepo;
  readonly rates = shippingRateRepo;
  readonly packaging = packagingTypeRepo;
}

export default new ShippingConfigRepository();
