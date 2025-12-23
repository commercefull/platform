/**
 * CalculateRates Use Case
 *
 * Calculates available shipping rates for an order.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ShippingAddress {
  countryCode: string;
  stateCode?: string;
  postalCode?: string;
  city?: string;
}

export interface ShippingItem {
  productId: string;
  quantity: number;
  weight?: number;
  price: number;
}

export interface CalculateRatesInput {
  destinationAddress: ShippingAddress;
  items: ShippingItem[];
  orderValue: number;
  storeId?: string;
  merchantId?: string;
  channelId?: string;
}

export interface ShippingRate {
  shippingMethodId: string;
  name: string;
  code: string;
  rate: number;
  currency: string;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  carrierName?: string;
}

export interface CalculateRatesOutput {
  rates: ShippingRate[];
  defaultRateId?: string;
}

export class CalculateRatesUseCase {
  constructor(
    private readonly shippingRepository: any, // ShippingRepository
    private readonly currencyCode: string = 'USD',
  ) {}

  async execute(input: CalculateRatesInput): Promise<CalculateRatesOutput> {
    // Calculate total weight
    const totalWeight = input.items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);

    // Find matching zones for destination
    const zones = await this.shippingRepository.findZonesForAddress(
      input.destinationAddress.countryCode,
      input.destinationAddress.stateCode,
      input.destinationAddress.postalCode,
    );

    if (zones.length === 0) {
      // Try default zone
      const defaultZone = await this.shippingRepository.findDefaultZone();
      if (defaultZone) {
        zones.push(defaultZone);
      }
    }

    const zoneIds = zones.map((z: any) => z.shippingZoneId);

    // Get shipping methods for zones
    const methods = await this.shippingRepository.findMethodsForZones(zoneIds, {
      storeId: input.storeId,
      merchantId: input.merchantId,
    });

    // Calculate rates for each method
    const rates: ShippingRate[] = [];
    let defaultRateId: string | undefined;

    for (const method of methods) {
      if (!method.isAvailableFor(totalWeight, input.orderValue)) {
        continue;
      }

      const rate = method.calculateRate(totalWeight, input.orderValue);

      rates.push({
        shippingMethodId: method.shippingMethodId,
        name: method.name,
        code: method.code,
        rate,
        currency: this.currencyCode,
        estimatedDaysMin: method.estimatedDaysMin,
        estimatedDaysMax: method.estimatedDaysMax,
        carrierName: method.carrierType,
      });

      if (method.isDefault) {
        defaultRateId = method.shippingMethodId;
      }
    }

    // Sort by rate
    rates.sort((a, b) => a.rate - b.rate);

    // If no default, use cheapest
    if (!defaultRateId && rates.length > 0) {
      defaultRateId = rates[0].shippingMethodId;
    }

    // Emit event
    eventBus.emit('shipping.rate_calculated', {
      destinationCountry: input.destinationAddress.countryCode,
      rateCount: rates.length,
      orderValue: input.orderValue,
    });

    return {
      rates,
      defaultRateId,
    };
  }
}
