/**
 * Calculate Shipping Rates Use Case
 * Calculates available shipping rates for a given destination and order
 */

import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';

const shippingZoneRepo = shippingConfigRepository.zones;
const shippingMethodRepo = shippingConfigRepository.methods;
const shippingRateRepo = shippingConfigRepository.rates;
import type { ShippingZone } from '../../infrastructure/repositories/ShippingConfigRepository';
import type { ShippingRate } from '../../infrastructure/repositories/ShippingConfigRepository';
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
  subtotal: number;
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
  amount: number;
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

export class CalculateShippingRatesUseCase {
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
      const zones = await shippingZoneRepo.findByLocation(destinationAddress.country, destinationAddress.state);

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
      const methods = await shippingMethodRepo.findAll(true, true);
      if (methods.length === 0) {
        return {
          success: false,
          rates: [],
          zone,
          message: 'No shipping methods available',
          errors: ['no_methods_available'],
        };
      }

      // 3. Get rates for each method across all matching zones
      const rateOptions: ShippingRateOption[] = [];

      for (const method of methods) {
        // Evaluate method-level conditions (minWeight, maxWeight, minOrderValue, maxOrderValue)
        const minOrderValue = method.minOrderValue ? parseFloat(String(method.minOrderValue)) : null;
        const maxOrderValue = method.maxOrderValue ? parseFloat(String(method.maxOrderValue)) : null;
        const minWeight = method.minWeight ? parseFloat(String(method.minWeight)) : null;
        const maxWeight = method.maxWeight ? parseFloat(String(method.maxWeight)) : null;
        const orderWeight = orderDetails.totalWeight ?? 0;

        if (minOrderValue !== null && orderDetails.subtotal < minOrderValue) continue;
        if (maxOrderValue !== null && orderDetails.subtotal > maxOrderValue) continue;
        if (minWeight !== null && orderWeight < minWeight) continue;
        if (maxWeight !== null && orderWeight > maxWeight) continue;

        // Find rate for this method across all matching zones
        let rate: ShippingRate | null = null;
        for (const z of zones) {
          rate = await shippingRateRepo.findByZoneAndMethod(z.shippingZoneId, method.shippingMethodId);
          if (rate) break;
        }

        if (rate) {
          // Evaluate conditions JSON field to filter/adjust the rate
          const condCtx: ShippingConditionContext = {
            subtotal: orderDetails.subtotal,
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

          const calculatedAmount = shippingRateRepo.calculateRate(
            rate,
            orderDetails.subtotal,
            orderDetails.itemCount,
            orderDetails.totalWeight,
          );

          const adjustedAmount = Math.max(0, calculatedAmount + condResult.adjustment);

          const estimatedDays = method.estimatedDeliveryDays
            ? typeof method.estimatedDeliveryDays === 'object'
              ? (method.estimatedDeliveryDays as { min?: number }).min ?? null
              : method.estimatedDeliveryDays as number
            : method.handlingDays;

          rateOptions.push({
            shippingMethodId: method.shippingMethodId,
            shippingMethodName: method.name,
            shippingMethodCode: method.code,
            shippingCarrierId: method.shippingCarrierId,
            rateId: rate.shippingRateId,
            rateName: rate.name,
            rateType: rate.rateType,
            amount: adjustedAmount,
            currency: rate.currency,
            estimatedDeliveryDays: estimatedDays,
            isFreeShipping: adjustedAmount === 0,
            taxable: rate.taxable,
          });
        }
      }

      // Sort by amount (cheapest first)
      rateOptions.sort((a, b) => a.amount - b.amount);

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

export const calculateShippingRatesUseCase = new CalculateShippingRatesUseCase();
