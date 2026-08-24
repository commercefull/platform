/**
 * Get Shipping Methods Use Case
 * Retrieves available shipping methods with optional filtering
 */

import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';
import type { ShippingMethod } from '../../infrastructure/repositories/ShippingConfigRepository';
import type { ShippingCarrier } from '../../infrastructure/repositories/ShippingConfigRepository';

const shippingMethodRepo = shippingConfigRepository.methods;
const shippingCarrierRepo = shippingConfigRepository.carriers;

// ============================================================================
// Query
// ============================================================================

export class GetShippingMethodsQuery {
  constructor(
    public readonly activeOnly: boolean = true,
    public readonly displayOnFrontend: boolean = false,
    public readonly carrierId?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ShippingMethodWithCarrier extends ShippingMethod {
  carrier?: ShippingCarrier;
}

export interface GetShippingMethodsResponse {
  success: boolean;
  methods: ShippingMethodWithCarrier[];
  total: number;
  message?: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class GetShippingMethodsUseCase {
  async execute(query: GetShippingMethodsQuery): Promise<GetShippingMethodsResponse> {
    try {
      let methods: ShippingMethod[];

      if (query.carrierId) {
        methods = await shippingMethodRepo.findByCarrier(query.carrierId, query.activeOnly);
      } else {
        methods = await shippingMethodRepo.findAll(query.activeOnly, query.displayOnFrontend);
      }

      // Enrich with carrier information
      const methodsWithCarriers: ShippingMethodWithCarrier[] = [];
      const carrierCache = new Map<string, ShippingCarrier>();

      for (const method of methods) {
        const enrichedMethod: ShippingMethodWithCarrier = { ...method };

        if (method.shippingCarrierId) {
          let carrier = carrierCache.get(method.shippingCarrierId);
          if (!carrier) {
            carrier = (await shippingCarrierRepo.findById(method.shippingCarrierId)) || undefined;
            if (carrier) {
              carrierCache.set(method.shippingCarrierId, carrier);
            }
          }
          enrichedMethod.carrier = carrier;
        }

        methodsWithCarriers.push(enrichedMethod);
      }

      return {
        success: true,
        methods: methodsWithCarriers,
        total: methodsWithCarriers.length,
        message: `Found ${methodsWithCarriers.length} shipping method(s)`,
      };
    } catch (error: unknown) {
      return {
        success: false,
        methods: [],
        total: 0,
        message: (error as Error).message || 'Failed to retrieve shipping methods',
      };
    }
  }
}

export const getShippingMethodsUseCase = new GetShippingMethodsUseCase();
