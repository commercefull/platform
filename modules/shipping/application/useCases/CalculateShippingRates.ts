/**
 * Calculate Shipping Rates Use Case
 * Calculates available shipping rates for a given destination and order
 */

import type { ShippingZone, ShippingRate } from '../../../../libs/db/types';
import type { ShippingZonePort, ShippingMethodPort } from '../../domain/repositories/ShippingConfigPorts';
import { calculateRate } from '../../domain/services/calculateRate';
import { evaluateConditions, ShippingConditionContext } from '../../domain/services/ShippingConditionsEvaluator';

// ============================================================================
// Command
// ============================================================================

export interface ShippingAddress {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
}

export interface OrderDetails {
  subtotalCents: number;
  itemCount: number;
  totalWeight?: number;
  currency?: string;
}

export class CalculateShippingRatesCommand {
  constructor(
    public readonly destinationAddress: ShippingAddress,
    public readonly orderDetails: OrderDetails,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ShippingRateOption {
  shippingMethodId: string;
  shippingMethodName: string;
  shippingMethodCode: string;
  shippingCarrierId: string | null;
  rateId: string;
  rateName: string | null;
  rateType: string;
  amountCents: number;
  currency: string;
  estimatedDeliveryDays: number | null;
  isFreeShipping: boolean;
  taxable: boolean;
}

export interface CalculateShippingRatesResponse {
  success: boolean;
  rates: ShippingRateOption[];
  zone?: ShippingZone;
  message?: string;
  errors?: string[];
}

// ============================================================================
// Use Case
// ============================================================================

export interface ShippingRateFinderPort {
  findByZoneAndMethod(zoneId: string, methodId: string): Promise<ShippingRate | null>;
  findByZonesAndMethods(zoneIds: string[], methodIds: string[]): Promise<ShippingRate[]>;
}

export class CalculateShippingRatesUseCase {
  constructor(
    private readonly shippingZoneRepo: ShippingZonePort,
    private readonly shippingMethodRepo: Pick<ShippingMethodPort, 'findAll'>,
    private readonly shippingRateRepo: ShippingRateFinderPort,
  ) {}

  async execute(command: CalculateShippingRatesCommand): Promise<CalculateShippingRatesResponse> {
    const { destinationAddress, orderDetails } = command;

    // Validate input
    if (!destinationAddress.country) {
      return {
        success: false,
        rates: [],
        message: 'Destination country is required',
        errors: ['country_required'],
      };
    }

    try {
      // 1. Find applicable shipping zone
      const zones = await this.shippingZoneRepo.findByLocation(destinationAddress.country, destinationAddress.state);

      if (zones.length === 0) {
        return {
          success: false,
          rates: [],
          message: 'No shipping available to this location',
          errors: ['no_zone_found'],
        };
      }

      // Use first zone for response metadata
      const zone = zones[0];

      // 2. Get active shipping methods
      const methods = await this.shippingMethodRepo.findAll(true, true);
      if (methods.length === 0) {
        return {
          success: false,
          rates: [],
          zone,
          message: 'No shipping methods available',
          errors: ['no_methods_available'],
        };
      }

      // 3. Get rates for each method across all matching zones — one batch
      // query instead of a zone×method loop of individual lookups.
      const eligibleMethods = methods.filter(method => {
        const minOrderValueCents = method.minOrderValueCents ? Number(method.minOrderValueCents) : null;
        const maxOrderValueCents = method.maxOrderValueCents ? Number(method.maxOrderValueCents) : null;
        const minWeight = method.minWeight ? parseFloat(String(method.minWeight)) : null;
        const maxWeight = method.maxWeight ? parseFloat(String(method.maxWeight)) : null;
        const orderWeight = orderDetails.totalWeight ?? 0;

        if (minOrderValueCents !== null && orderDetails.subtotalCents < minOrderValueCents) return false;
        if (maxOrderValueCents !== null && orderDetails.subtotalCents > maxOrderValueCents) return false;
        if (minWeight !== null && orderWeight < minWeight) return false;
        if (maxWeight !== null && orderWeight > maxWeight) return false;
        return true;
      });

      const zoneIds = zones.map(z => z.shippingZoneId);
      const zoneRank = new Map(zoneIds.map((id, i) => [id, i]));
      const allRates =
        eligibleMethods.length === 0
          ? []
          : await this.shippingRateRepo.findByZonesAndMethods(
              zoneIds,
              eligibleMethods.map(m => m.shippingMethodId),
            );

      // For each method keep the rate from the earliest matching zone;
      // rows arrive ordered by priority so the first seen per pair wins.
      const rateByMethod = new Map<string, ShippingRate>();
      for (const rate of allRates) {
        const existing = rateByMethod.get(rate.shippingMethodId);
        if (!existing || (zoneRank.get(rate.shippingZoneId) ?? Infinity) < (zoneRank.get(existing.shippingZoneId) ?? Infinity)) {
          rateByMethod.set(rate.shippingMethodId, rate);
        }
      }

      const rateOptions: ShippingRateOption[] = [];

      for (const method of eligibleMethods) {
        const rate = rateByMethod.get(method.shippingMethodId) ?? null;

        if (rate) {
          // Evaluate conditions JSON field to filter/adjust the rate
          const condCtx: ShippingConditionContext = {
            subtotalCents: orderDetails.subtotalCents,
            itemCount: orderDetails.itemCount,
            totalWeight: orderDetails.totalWeight,
            country: destinationAddress.country,
            state: destinationAddress.state,
            postalCode: destinationAddress.postalCode,
            currency: orderDetails.currency,
            orderDate: new Date(),
          };

          const condResult = evaluateConditions(rate.conditions, condCtx);
          if (!condResult.applicable) {
            continue;
          }

          const calculatedAmountCents = calculateRate(rate, orderDetails.subtotalCents, orderDetails.itemCount, orderDetails.totalWeight);

          const adjustedAmountCents = Math.max(0, calculatedAmountCents + condResult.adjustmentCents);

          const estimatedDays = method.estimatedDeliveryDays
            ? typeof method.estimatedDeliveryDays === 'object'
              ? ((method.estimatedDeliveryDays as { min?: number }).min ?? null)
              : (method.estimatedDeliveryDays as number)
            : method.handlingDays;

          rateOptions.push({
            shippingMethodId: method.shippingMethodId,
            shippingMethodName: method.name,
            shippingMethodCode: method.code,
            shippingCarrierId: method.shippingCarrierId,
            rateId: rate.shippingRateId,
            rateName: rate.name,
            rateType: rate.rateType,
            amountCents: adjustedAmountCents,
            currency: rate.currencyCode,
            estimatedDeliveryDays: estimatedDays,
            isFreeShipping: adjustedAmountCents === 0,
            taxable: rate.taxable,
          });
        }
      }

      // Sort by amount (cheapest first)
      rateOptions.sort((a, b) => a.amountCents - b.amountCents);

      return {
        success: true,
        rates: rateOptions,
        zone,
        message:
          rateOptions.length > 0 ? `Found ${rateOptions.length} shipping option(s)` : 'No shipping rates available for this location',
      };
    } catch (error: unknown) {
      return {
        success: false,
        rates: [],
        message: (error as Error).message || 'Failed to calculate shipping rates',
        errors: ['calculation_failed'],
      };
    }
  }
}
