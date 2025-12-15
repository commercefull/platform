/**
 * Calculate Shipping Rates Use Case
 * Calculates available shipping rates for a given destination and order
 */

import shippingZoneRepo, { ShippingZone } from '../../repos/shippingZoneRepo';
import shippingMethodRepo, { ShippingMethod } from '../../repos/shippingMethodRepo';
import shippingRateRepo, { ShippingRate } from '../../repos/shippingRateRepo';

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
    public readonly orderDetails: OrderDetails
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
        errors: ['country_required']
      };
    }

    try {
      // 1. Find applicable shipping zone
      const zones = await shippingZoneRepo.findByLocation(
        destinationAddress.country,
        destinationAddress.state
      );

      if (zones.length === 0) {
        return {
          success: false,
          rates: [],
          message: 'No shipping available to this location',
          errors: ['no_zone_found']
        };
      }

      // Use highest priority zone
      const zone = zones[0];

      // 2. Get active shipping methods
      const methods = await shippingMethodRepo.findAll(true, true);
      if (methods.length === 0) {
        return {
          success: false,
          rates: [],
          zone,
          message: 'No shipping methods available',
          errors: ['no_methods_available']
        };
      }

      // 3. Get rates for each method in this zone
      const rateOptions: ShippingRateOption[] = [];

      for (const method of methods) {
        const rate = await shippingRateRepo.findByZoneAndMethod(
          zone.shippingZoneId,
          method.shippingMethodId
        );

        if (rate) {
          const calculatedAmount = shippingRateRepo.calculateRate(
            rate,
            orderDetails.subtotal,
            orderDetails.itemCount,
            orderDetails.totalWeight
          );

          const estimatedDays = method.estimatedDeliveryDays 
            ? (typeof method.estimatedDeliveryDays === 'object' 
                ? (method.estimatedDeliveryDays as any).min 
                : method.estimatedDeliveryDays)
            : method.handlingDays;

          rateOptions.push({
            shippingMethodId: method.shippingMethodId,
            shippingMethodName: method.name,
            shippingMethodCode: method.code,
            shippingCarrierId: method.shippingCarrierId,
            rateId: rate.shippingRateId,
            rateName: rate.name,
            rateType: rate.rateType,
            amount: calculatedAmount,
            currency: rate.currency,
            estimatedDeliveryDays: estimatedDays,
            isFreeShipping: calculatedAmount === 0,
            taxable: rate.taxable
          });
        }
      }

      // Sort by amount (cheapest first)
      rateOptions.sort((a, b) => a.amount - b.amount);

      return {
        success: true,
        rates: rateOptions,
        zone,
        message: rateOptions.length > 0 
          ? `Found ${rateOptions.length} shipping option(s)` 
          : 'No shipping rates available for this location'
      };
    } catch (error: any) {
      return {
        success: false,
        rates: [],
        message: error.message || 'Failed to calculate shipping rates',
        errors: ['calculation_failed']
      };
    }
  }
}

export const calculateShippingRatesUseCase = new CalculateShippingRatesUseCase();
