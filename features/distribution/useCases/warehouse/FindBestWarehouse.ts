/**
 * Find Best Warehouse Use Case
 * Determines the optimal warehouse for fulfilling an order based on location, 
 * availability, and shipping method support
 */
import * as warehouseRepo from '../../repos/warehouseRepo';
import * as fulfillmentRepo from '../../repos/fulfillmentRepo';

export interface FindBestWarehouseInput {
  destinationCountry: string;
  destinationState?: string;
  destinationPostalCode?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  shippingMethodId?: string;
  productIds?: string[];
  preferredWarehouseId?: string;
}

export interface FindBestWarehouseOutput {
  success: boolean;
  warehouse?: {
    id: string;
    name: string;
    code: string;
    distance?: number;
    processingTime: number;
    canFulfillNow: boolean;
  };
  alternativeWarehouses?: Array<{
    id: string;
    name: string;
    distance?: number;
  }>;
  error?: string;
}

export class FindBestWarehouse {
  async execute(input: FindBestWarehouseInput): Promise<FindBestWarehouseOutput> {
    try {
      // 1. Get all active fulfillment centers
      const warehouses = await warehouseRepo.findActiveWarehouses();
      const fulfillmentCenters = warehouses.filter(w => w.isFulfillmentCenter);

      if (fulfillmentCenters.length === 0) {
        return { success: false, error: 'No active fulfillment centers available' };
      }

      // 2. If preferred warehouse is specified and valid, use it
      if (input.preferredWarehouseId) {
        const preferred = fulfillmentCenters.find(
          w => w.distributionWarehouseId === input.preferredWarehouseId
        );
        if (preferred && this.warehouseCanFulfill(preferred, input)) {
          return {
            success: true,
            warehouse: this.mapWarehouse(preferred)
          };
        }
      }

      // 3. Try to find warehouse using distribution rules
      const ruleBasedWarehouse = await this.findWarehouseByRules(input);
      if (ruleBasedWarehouse) {
        const warehouse = fulfillmentCenters.find(
          w => w.distributionWarehouseId === ruleBasedWarehouse
        );
        if (warehouse && this.warehouseCanFulfill(warehouse, input)) {
          return {
            success: true,
            warehouse: this.mapWarehouse(warehouse)
          };
        }
      }

      // 4. Find nearest warehouse by location
      if (input.destinationLatitude && input.destinationLongitude) {
        const nearest = this.findNearestWarehouse(
          fulfillmentCenters,
          input.destinationLatitude,
          input.destinationLongitude,
          input
        );
        if (nearest) {
          return {
            success: true,
            warehouse: nearest.best,
            alternativeWarehouses: nearest.alternatives
          };
        }
      }

      // 5. Find by country/region matching
      const regionMatch = this.findWarehouseByRegion(fulfillmentCenters, input);
      if (regionMatch) {
        return {
          success: true,
          warehouse: this.mapWarehouse(regionMatch)
        };
      }

      // 6. Fall back to default warehouse
      const defaultWarehouse = fulfillmentCenters.find(w => w.isDefault);
      if (defaultWarehouse) {
        return {
          success: true,
          warehouse: this.mapWarehouse(defaultWarehouse)
        };
      }

      // 7. Use first available warehouse
      const firstAvailable = fulfillmentCenters[0];
      return {
        success: true,
        warehouse: this.mapWarehouse(firstAvailable)
      };
    } catch (error) {
      console.error('FindBestWarehouse error:', error);
      return { success: false, error: 'Failed to find best warehouse' };
    }
  }

  private async findWarehouseByRules(input: FindBestWarehouseInput): Promise<string | null> {
    try {
      const rules = await fulfillmentRepo.findActiveDistributionRules();
      const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

      for (const rule of sortedRules) {
        if (this.ruleMatchesDestination(rule, input)) {
          return rule.distributionWarehouseId || null;
        }
      }

      const defaultRule = await fulfillmentRepo.findDefaultDistributionRule();
      if (defaultRule?.distributionWarehouseId) {
        return defaultRule.distributionWarehouseId;
      }

      return null;
    } catch {
      return null;
    }
  }

  private ruleMatchesDestination(rule: any, input: FindBestWarehouseInput): boolean {
    if (rule.applicableCountries?.length > 0) {
      if (!rule.applicableCountries.includes(input.destinationCountry.toUpperCase())) {
        return false;
      }
    }

    if (rule.applicableRegions?.length > 0 && input.destinationState) {
      if (!rule.applicableRegions.includes(input.destinationState.toUpperCase())) {
        return false;
      }
    }

    if (rule.applicablePostalCodes?.length > 0 && input.destinationPostalCode) {
      const matches = rule.applicablePostalCodes.some((pattern: string) => {
        if (pattern.endsWith('*')) {
          return input.destinationPostalCode!.startsWith(pattern.slice(0, -1));
        }
        return pattern === input.destinationPostalCode;
      });
      if (!matches) return false;
    }

    if (rule.distributionShippingMethodId && input.shippingMethodId) {
      if (rule.distributionShippingMethodId !== input.shippingMethodId) {
        return false;
      }
    }

    return true;
  }

  private findNearestWarehouse(
    warehouses: any[],
    lat: number,
    lng: number,
    input: FindBestWarehouseInput
  ): { best: any; alternatives: any[] } | null {
    const warehousesWithDistance = warehouses
      .filter(w => w.latitude && w.longitude)
      .map(w => ({
        warehouse: w,
        distance: this.calculateDistance(lat, lng, parseFloat(w.latitude), parseFloat(w.longitude))
      }))
      .filter(w => this.warehouseCanFulfill(w.warehouse, input))
      .sort((a, b) => a.distance - b.distance);

    if (warehousesWithDistance.length === 0) return null;

    const best = warehousesWithDistance[0];
    const alternatives = warehousesWithDistance.slice(1, 4).map(w => ({
      id: w.warehouse.distributionWarehouseId,
      name: w.warehouse.name,
      distance: Math.round(w.distance)
    }));

    return {
      best: {
        ...this.mapWarehouse(best.warehouse),
        distance: Math.round(best.distance)
      },
      alternatives
    };
  }

  private findWarehouseByRegion(warehouses: any[], input: FindBestWarehouseInput): any | null {
    const sameCountry = warehouses.find(
      w => w.country?.toUpperCase() === input.destinationCountry.toUpperCase()
    );
    if (sameCountry && this.warehouseCanFulfill(sameCountry, input)) {
      return sameCountry;
    }

    const regionMap: Record<string, string[]> = {
      'NORTH_AMERICA': ['US', 'CA', 'MX'],
      'EUROPE': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE'],
      'ASIA_PACIFIC': ['JP', 'KR', 'CN', 'AU', 'NZ', 'SG']
    };

    for (const [, countries] of Object.entries(regionMap)) {
      if (countries.includes(input.destinationCountry.toUpperCase())) {
        const regionalWarehouse = warehouses.find(
          w => countries.includes(w.country?.toUpperCase())
        );
        if (regionalWarehouse && this.warehouseCanFulfill(regionalWarehouse, input)) {
          return regionalWarehouse;
        }
      }
    }

    return null;
  }

  private warehouseCanFulfill(warehouse: any, input: FindBestWarehouseInput): boolean {
    if (!warehouse.isActive || !warehouse.isFulfillmentCenter) return false;

    if (input.shippingMethodId && warehouse.shippingMethods?.length > 0) {
      if (!warehouse.shippingMethods.includes(input.shippingMethodId)) {
        return false;
      }
    }

    return true;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private mapWarehouse(warehouse: any): any {
    return {
      id: warehouse.distributionWarehouseId,
      name: warehouse.name,
      code: warehouse.code,
      processingTime: warehouse.processingTime || 24,
      canFulfillNow: this.canFulfillNow(warehouse)
    };
  }

  private canFulfillNow(warehouse: any): boolean {
    if (!warehouse.cutoffTime) return true;

    const now = new Date();
    const warehouseTime = new Date(now.toLocaleString('en-US', { timeZone: warehouse.timezone || 'UTC' }));
    const currentTime = `${warehouseTime.getHours().toString().padStart(2, '0')}:${warehouseTime.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime < warehouse.cutoffTime;
  }
}

export const findBestWarehouse = new FindBestWarehouse();
