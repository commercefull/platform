/**
 * Get Carrier Capabilities Use Case
 *
 * Retrieves capability information for a specific shipping carrier.
 */

import type { ShippingCarrierPort } from '../../domain/repositories/ShippingConfigPorts';

export interface CarrierCapabilities {
  supportedServices?: unknown;
  supportedRegions?: unknown;
  hasApiIntegration?: boolean;
  requiresContract?: boolean;
}

export class GetCarrierCapabilitiesUseCase {
  constructor(private readonly shippingCarrierRepo: ShippingCarrierPort) {}

  async execute(carrierCode: string): Promise<CarrierCapabilities> {
    try {
      const carrier = await this.shippingCarrierRepo.findByCode(carrierCode);
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
