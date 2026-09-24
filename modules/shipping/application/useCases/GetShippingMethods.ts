/**
 * Get Shipping Methods Use Case
 * Retrieves available shipping methods with optional filtering
 */

import type { ShippingMethod } from '../../../../libs/db/types';
import type { ShippingCarrier } from '../../../../libs/db/types';
import type { ShippingCarrierPort, ShippingMethodPort } from '../../domain/repositories/ShippingConfigPorts';

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
  constructor(
    private readonly shippingMethodRepo: Pick<ShippingMethodPort, 'findAll' | 'findByCarrier'>,
    private readonly shippingCarrierRepo: Pick<ShippingCarrierPort, 'findById'>,
  ) {}

  async execute(query: GetShippingMethodsQuery): Promise<GetShippingMethodsResponse> {
    try {
      let methods: ShippingMethod[];

      if (query.carrierId) {
        methods = await this.shippingMethodRepo.findByCarrier(query.carrierId, query.activeOnly);
      } else {
        methods = await this.shippingMethodRepo.findAll(query.activeOnly, query.displayOnFrontend);
      }

      // Enrich with carrier information
      const methodsWithCarriers: ShippingMethodWithCarrier[] = [];
      const carrierCache = new Map<string, ShippingCarrier>();

      for (const method of methods) {
        const enrichedMethod: ShippingMethodWithCarrier = { ...method };

        if (method.shippingCarrierId) {
          let carrier = carrierCache.get(method.shippingCarrierId);
          if (!carrier) {
            carrier = (await this.shippingCarrierRepo.findById(method.shippingCarrierId)) || undefined;
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

