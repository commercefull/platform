/**
 * Shipping Composition Root
 *
 * Instantiates use cases with their concrete infrastructure repositories.
 * Interface layer (controllers/resolvers) should import the ready-made
 * use-case instances exported here rather than constructing them.
 */

import shippingConfigRepository from '../infrastructure/repositories/ShippingConfigRepository';
import shippingLabelRepo from '../infrastructure/repositories/ShippingLabelAggregateRepository';
import { CalculateShippingRatesUseCase } from './useCases/CalculateShippingRates';
import { CreateShipmentUseCase } from './useCases/CreateShipment';
import { CreateShippingLabelUseCase } from './useCases/CreateShippingLabel';
import { GetCarrierCapabilitiesUseCase } from './useCases/GetCarrierCapabilities';
import { GetShippingLabelUseCase } from './useCases/GetShippingLabel';
import { GetShippingMethodDetailsUseCase } from './useCases/GetShippingMethodDetails';
import { GetShippingMethodsUseCase } from './useCases/GetShippingMethods';
import { ManageShippingZonesUseCase } from './useCases/ManageShippingZones';
import { ManageShippingMethodsUseCase } from './useCases/ManageShippingMethods';
import { ManageShippingRatesUseCase } from './useCases/ManageShippingRates';
import { ManageShippingZonesLookupUseCase } from './useCases/ManageShippingZonesLookup';
import { ManageShippingMethodsAdminUseCase } from './useCases/ManageShippingMethodsAdmin';
import { TrackShipmentUseCase } from './useCases/TrackShipment';
import { VoidShippingLabelUseCase } from './useCases/VoidShippingLabel';
import { EstimateDeliveryWindowUseCase } from './useCases/EstimateDeliveryWindow';
import { ManageShippingConfigurationUseCase } from './useCases/ManageShippingConfig';
import type {
  CreateShippingCarrierInput,
  UpdateShippingCarrierInput,
  CreateShippingMethodInput,
  UpdateShippingMethodInput,
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
  CreateShippingRateInput,
  UpdateShippingRateInput,
  CreateShippingPackagingTypeInput,
  UpdateShippingPackagingTypeInput,
} from '../infrastructure/repositories/ShippingConfigRepository';
import type { CreateShippingSurchargeInput, UpdateShippingSurchargeInput } from '../infrastructure/repositories/ShippingConfigRepository';

export const calculateShippingRatesUseCase = new CalculateShippingRatesUseCase(
  shippingConfigRepository.zones,
  shippingConfigRepository.methods,
  shippingConfigRepository.rates,
);
export const createShipmentUseCase = new CreateShipmentUseCase(shippingConfigRepository.carriers, shippingConfigRepository.methods);
export const createShippingLabelUseCase = new CreateShippingLabelUseCase(shippingLabelRepo, shippingConfigRepository.carriers);
export const getCarrierCapabilitiesUseCase = new GetCarrierCapabilitiesUseCase(shippingConfigRepository.carriers);
export const getShippingLabelUseCase = new GetShippingLabelUseCase(shippingLabelRepo);
export const getShippingMethodDetailsUseCase = new GetShippingMethodDetailsUseCase(
  shippingConfigRepository.methods,
  shippingConfigRepository.rates,
);
export const getShippingMethodsUseCase = new GetShippingMethodsUseCase(shippingConfigRepository.methods, shippingConfigRepository.carriers);
export const manageShippingZonesUseCase = new ManageShippingZonesUseCase(shippingConfigRepository.zones);
export const manageShippingMethodsUseCase = new ManageShippingMethodsUseCase(shippingConfigRepository.methods);
export const manageShippingRatesUseCase = new ManageShippingRatesUseCase(shippingConfigRepository.rates);
export const manageShippingZonesLookupUseCase = new ManageShippingZonesLookupUseCase(shippingConfigRepository.zones);
export const manageShippingMethodsAdminUseCase = new ManageShippingMethodsAdminUseCase(shippingConfigRepository.methods);
export const trackShipmentUseCase = new TrackShipmentUseCase(shippingLabelRepo);
export const voidShippingLabelUseCase = new VoidShippingLabelUseCase(shippingLabelRepo);
export const estimateDeliveryWindowUseCase = new EstimateDeliveryWindowUseCase(shippingConfigRepository.methods);
export const manageShippingConfigurationUseCase = new ManageShippingConfigurationUseCase(
  shippingConfigRepository.carriers,
  shippingConfigRepository.packaging,
  {
    ...shippingConfigRepository.surcharges,
    findActiveByRateId: (shippingRateId: string) => shippingConfigRepository.surcharges.findByRateId(shippingRateId, true),
  },
);

export {
  shippingConfigRepository,
  shippingLabelRepo,
  CreateShippingCarrierInput,
  UpdateShippingCarrierInput,
  CreateShippingMethodInput,
  UpdateShippingMethodInput,
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
  CreateShippingRateInput,
  UpdateShippingRateInput,
  CreateShippingPackagingTypeInput,
  UpdateShippingPackagingTypeInput,
  CreateShippingSurchargeInput,
  UpdateShippingSurchargeInput,
};
