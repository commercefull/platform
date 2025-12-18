/**
 * Calculate Shipping Rate Use Case
 * Calculates shipping cost for a destination and shipping method
 */
import * as shippingRepo from '../../repos/shippingRepo';
import { Money } from '../../domain/valueObjects/Money';

export interface CalculateShippingRateInput {
  destinationCountry: string;
  destinationState?: string;
  destinationPostalCode?: string;
  shippingMethodId: string;
  orderValue: number;
  orderWeight?: number;
  weightUnit?: 'kg' | 'g' | 'lb' | 'oz';
  currency?: string;
  itemCount?: number;
  orderId?: string;
}

export interface CalculateShippingRateOutput {
  success: boolean;
  rate?: {
    baseRate: Money;
    perItemRate: Money;
    totalRate: Money;
    isFreeShipping: boolean;
    zoneId: string;
    zoneName: string;
    methodId: string;
    methodName: string;
  };
  error?: string;
}

export class CalculateShippingRate {
  async execute(input: CalculateShippingRateInput): Promise<CalculateShippingRateOutput> {
    try {
      const currency = input.currency || 'USD';

      // 1. Get shipping method
      const method = await shippingRepo.findShippingMethodById(input.shippingMethodId);
      if (!method) {
        return { success: false, error: 'Shipping method not found' };
      }

      if (!method.isActive) {
        return { success: false, error: 'Shipping method is not active' };
      }

      // 2. Find matching zone
      const zones = await shippingRepo.findAllShippingZones({});
      const matchingZone = this.findMatchingZone(zones.zones, input);

      if (!matchingZone) {
        return { success: false, error: 'No shipping zone available for this destination' };
      }

      // 3. Get rate for zone and method
      const rates = await shippingRepo.findShippingRatesByZoneAndMethod(
        matchingZone.distributionShippingZoneId,
        input.shippingMethodId
      );

      if (!rates || rates.length === 0) {
        return { success: false, error: 'No shipping rate configured for this zone and method' };
      }

      // 4. Calculate rate
      const rate = rates[0] as any;
      const baseRateValue = typeof rate.baseRate === 'number' ? rate.baseRate : parseFloat(rate.baseRate) || 0;
      const perItemRateValue = typeof rate.perItemRate === 'number' ? rate.perItemRate : parseFloat(rate.perItemRate) || 0;
      const baseRate = Money.create(baseRateValue, currency);
      const perItemRate = Money.create(perItemRateValue, currency);
      const itemCount = input.itemCount || 1;

      let totalRate = baseRate.add(perItemRate.multiply(itemCount));

      // Check for free shipping threshold
      const freeThreshold = rate.freeShippingThreshold ? parseFloat(rate.freeShippingThreshold) : null;
      const isFreeShipping = freeThreshold !== null && input.orderValue >= freeThreshold;
      if (isFreeShipping) {
        totalRate = Money.zero(currency);
      }

      return {
        success: true,
        rate: {
          baseRate,
          perItemRate,
          totalRate,
          isFreeShipping: !!isFreeShipping,
          zoneId: matchingZone.distributionShippingZoneId,
          zoneName: matchingZone.name,
          methodId: method.distributionShippingMethodId,
          methodName: method.name
        }
      };
    } catch (error) {
      console.error('CalculateShippingRate error:', error);
      return { success: false, error: 'Failed to calculate shipping rate' };
    }
  }

  private findMatchingZone(zones: any[], input: CalculateShippingRateInput): any | null {
    const activeZones = zones.filter(z => z.isActive);
    const sortedZones = [...activeZones].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const zone of sortedZones) {
      if (this.zoneMatchesDestination(zone, input)) {
        return zone;
      }
    }

    return null;
  }

  private zoneMatchesDestination(zone: any, input: CalculateShippingRateInput): boolean {
    const locations = zone.locations || [];
    const excludedLocations = zone.excludedLocations || [];

    // Check exclusions first
    if (this.locationMatches(excludedLocations, input)) {
      return false;
    }

    // Check inclusions
    if (locations.length === 0) {
      return true; // Empty locations means all locations
    }

    return this.locationMatches(locations, input);
  }

  private locationMatches(locations: string[], input: CalculateShippingRateInput): boolean {
    for (const location of locations) {
      // Country match
      if (location.toUpperCase() === input.destinationCountry.toUpperCase()) {
        return true;
      }

      // Country:State match
      if (location.includes(':') && input.destinationState) {
        const [country, state] = location.split(':');
        if (
          country.toUpperCase() === input.destinationCountry.toUpperCase() &&
          state.toUpperCase() === input.destinationState.toUpperCase()
        ) {
          return true;
        }
      }

      // Postal code prefix match
      if (location.endsWith('*') && input.destinationPostalCode) {
        const prefix = location.slice(0, -1);
        if (input.destinationPostalCode.startsWith(prefix)) {
          return true;
        }
      }
    }

    return false;
  }
}

export const calculateShippingRate = new CalculateShippingRate();
