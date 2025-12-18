/**
 * Get Available Shipping Methods Use Case
 * Returns all shipping methods available for a destination with calculated rates
 */
import * as shippingRepo from '../../repos/shippingRepo';
import { calculateShippingRate } from './CalculateShippingRate';

export interface GetAvailableShippingMethodsInput {
  destinationCountry: string;
  destinationState?: string;
  destinationPostalCode?: string;
  orderValue: number;
  orderWeight?: number;
  weightUnit?: 'kg' | 'g' | 'lb' | 'oz';
  currency?: string;
  itemCount?: number;
}

export interface AvailableShippingMethod {
  id: string;
  name: string;
  description?: string;
  carrierName?: string;
  estimatedDeliveryDays?: { min: number; max: number };
  rate: number;
  formattedRate: string;
  isFreeShipping: boolean;
  isDefault: boolean;
}

export interface GetAvailableShippingMethodsOutput {
  success: boolean;
  methods?: AvailableShippingMethod[];
  defaultMethodId?: string;
  error?: string;
}

export class GetAvailableShippingMethods {
  async execute(input: GetAvailableShippingMethodsInput): Promise<GetAvailableShippingMethodsOutput> {
    try {
      const currency = input.currency || 'USD';

      // 1. Get all active shipping methods
      const methods = await shippingRepo.findActiveShippingMethods();

      if (!methods || methods.length === 0) {
        return { success: false, error: 'No shipping methods available' };
      }

      // 2. Calculate rates for each method
      const availableMethods: AvailableShippingMethod[] = [];
      let defaultMethodId: string | undefined;

      for (const method of methods) {
        const rateResult = await calculateShippingRate.execute({
          destinationCountry: input.destinationCountry,
          destinationState: input.destinationState,
          destinationPostalCode: input.destinationPostalCode,
          shippingMethodId: method.distributionShippingMethodId,
          orderValue: input.orderValue,
          orderWeight: input.orderWeight,
          weightUnit: input.weightUnit,
          currency,
          itemCount: input.itemCount
        });

        if (rateResult.success && rateResult.rate) {
          // Cast to any to access optional properties that may exist in the database
          const methodData = method as any;
          
          // Get carrier info if available
          let carrierName: string | undefined;
          if (methodData.distributionShippingCarrierId) {
            const carrier = await shippingRepo.findShippingCarrierById(methodData.distributionShippingCarrierId);
            carrierName = carrier?.name;
          } else if (methodData.carrier) {
            carrierName = methodData.carrier;
          }

          availableMethods.push({
            id: method.distributionShippingMethodId,
            name: method.name,
            description: method.description || undefined,
            carrierName,
            estimatedDeliveryDays: methodData.minDeliveryDays && methodData.maxDeliveryDays
              ? { min: methodData.minDeliveryDays, max: methodData.maxDeliveryDays }
              : undefined,
            rate: rateResult.rate.totalRate.amount,
            formattedRate: rateResult.rate.totalRate.format(),
            isFreeShipping: rateResult.rate.isFreeShipping,
            isDefault: methodData.isDefault || false
          });

          if (methodData.isDefault) {
            defaultMethodId = method.distributionShippingMethodId;
          }
        }
      }

      if (availableMethods.length === 0) {
        return { success: false, error: 'No shipping methods available for this destination' };
      }

      // Sort by rate (cheapest first)
      availableMethods.sort((a, b) => a.rate - b.rate);

      return {
        success: true,
        methods: availableMethods,
        defaultMethodId
      };
    } catch (error) {
      console.error('GetAvailableShippingMethods error:', error);
      return { success: false, error: 'Failed to get available shipping methods' };
    }
  }
}

export const getAvailableShippingMethods = new GetAvailableShippingMethods();
