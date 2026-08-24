/**
 * Get Carrier Capabilities Use Case
 *
 * Retrieves capability information for a specific shipping carrier.
 */

import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';

const shippingCarrierRepo = shippingConfigRepository.carriers;

export interface CarrierCapabilities {
  supportedServices?: unknown;
  supportedRegions?: unknown;
  hasApiIntegration?: boolean;
  requiresContract?: boolean;
}

export class GetCarrierCapabilitiesUseCase {
  async execute(carrierCode: string): Promise<CarrierCapabilities> {
    try {
      const carrier = await shippingCarrierRepo.findByCode(carrierCode);
      return carrier
        ? {
            supportedServices: carrier.supportedServices,
            supportedRegions: carrier.supportedRegions,
            hasApiIntegration: carrier.hasApiIntegration,
            requiresContract: carrier.requiresContract,
          }
        : {};
    } catch {
      return {};
    }
  }
}

export const getCarrierCapabilitiesUseCase = new GetCarrierCapabilitiesUseCase();
