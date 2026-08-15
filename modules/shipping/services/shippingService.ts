import ShippingCarrierRepo from '../infrastructure/repositories/shippingCarrierRepo';
import ShippingMethodRepo, { ShippingMethod } from '../infrastructure/repositories/shippingMethodRepo';
import ShippingRateRepo from '../infrastructure/repositories/shippingRateRepo';
import ShippingZoneRepo from '../infrastructure/repositories/shippingZoneRepo';
import { generateUUID } from '../../../libs/uuid';
import { logger } from '../../../libs/logger';
import { query } from '../../../libs/db';

/**
 * Extended shipping method properties that may come from customFields
 * or from extended domain logic beyond the base DB type.
 */
interface ShippingMethodExtended extends ShippingMethod {
  baseRate?: number;
  weightRate?: number;
  freeWeight?: number;
  distanceRate?: number;
  freeDistance?: number;
  insuranceIncluded?: boolean;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Package {
  weight: number; // in lbs
  length: number; // in inches
  width: number;
  height: number;
  value?: number; // declared value
  description?: string;
}

export interface ShippingQuote {
  carrier: string;
  method: string;
  serviceCode: string;
  rate: number;
  currency: string;
  estimatedDays: number;
  guaranteedDelivery: boolean;
  trackingAvailable: boolean;
  insuranceIncluded: boolean;
}

export interface Shipment {
  shipmentId: string;
  trackingNumber: string;
  carrier: string;
  serviceCode: string;
  status: 'pending' | 'shipped' | 'delivered' | 'returned';
  shipDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  cost: number;
  insurance?: number;
  labels: ShippingLabel[];
}

export interface ShippingLabel {
  type: 'shipping' | 'return';
  format: 'pdf' | 'png' | 'zpl';
  data: string; // Base64 encoded label data
  trackingNumber: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  statusDetails: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  description: string;
  status: string;
}

export interface AddressValidationResult {
  valid: boolean;
  normalizedAddress?: Address;
  messages: string[];
}

export class ShippingService {
  private carrierRepo = ShippingCarrierRepo;
  private methodRepo = ShippingMethodRepo;
  private rateRepo = ShippingRateRepo;
  private zoneRepo = ShippingZoneRepo;

  /**
   * Calculate shipping rates for an order
   */
  async calculateRates(fromAddress: Address, toAddress: Address, packages: Package[], currency: string = 'USD'): Promise<ShippingQuote[]> {
    // 1. Find applicable shipping zone (simplified - find all active zones)
    const zones = await this.zoneRepo.findAll(true); // activeOnly = true
    const zone = zones.find(z => z.isActive) || zones[0]; // Use first active zone

    if (!zone) {
      throw new Error('No shipping zones available');
    }

    // 2. Get available shipping methods (find all active methods)
    const methods = await this.methodRepo.findAll(true); // activeOnly = true

    if (methods.length === 0) {
      return []; // No shipping methods available
    }

    // 3. Calculate rate for each method
    const quotes: ShippingQuote[] = [];

    for (const method of methods) {
      try {
        const rate = await this.calculateMethodRate(method, packages, zone, fromAddress, toAddress);
        if (rate) {
          quotes.push({
            carrier: method.shippingCarrierId || 'unknown',
            method: method.name,
            serviceCode: method.code,
            rate: rate.total,
            currency,
            estimatedDays: typeof method.estimatedDeliveryDays === 'object' && method.estimatedDeliveryDays !== null
              ? (method.estimatedDeliveryDays as { min?: number }).min ?? method.handlingDays ?? 3
              : method.handlingDays ?? 3,
            guaranteedDelivery: false, // Default value - not stored in interface
            trackingAvailable: true, // Default value - not stored in interface
            insuranceIncluded: rate.insurance > 0,
          });
        }
      } catch {
        // Continue with other methods
      }
    }

    // 4. Sort by rate
    return quotes.sort((a, b) => a.rate - b.rate);
  }

  /**
   * Validate shipping address
   */
  async validateAddress(address: Address): Promise<AddressValidationResult> {
    // Basic validation
    const messages: string[] = [];

    if (!address.street1) messages.push('Street address is required');
    if (!address.city) messages.push('City is required');
    if (!address.state) messages.push('State/Province is required');
    if (!address.postalCode) messages.push('Postal code is required');
    if (!address.country) messages.push('Country is required');

    // Carrier address validation APIs would be integrated here
    // For now, return basic validation
    return {
      valid: messages.length === 0,
      normalizedAddress: messages.length === 0 ? address : undefined,
      messages,
    };
  }

  /**
   * Create shipment with carrier
   */
  async createShipment(
    _orderId: string,
    fromAddress: Address,
    toAddress: Address,
    packages: Package[],
    carrierCode: string,
    serviceCode: string,
  ): Promise<Shipment> {
    // Get carrier and method details
    const carrier = await this.carrierRepo.findByCode(carrierCode);
    if (!carrier) {
      throw new Error(`Carrier ${carrierCode} not found`);
    }

    const method = await this.methodRepo.findByCode(serviceCode);
    if (!method) {
      throw new Error(`Shipping method ${serviceCode} not found`);
    }

    // Generate tracking number
    const trackingNumber = this.generateTrackingNumber(carrierCode);

    // Calculate cost (simplified - in real implementation, get from carrier API)
    const cost = await this.calculateShipmentCost(method, packages, fromAddress, toAddress);

    // Create shipment record
    const shipment: Shipment = {
      shipmentId: generateUUID(),
      trackingNumber,
      carrier: carrierCode,
      serviceCode,
      status: 'pending',
      shipDate: new Date().toISOString(),
      estimatedDeliveryDate: this.calculateEstimatedDelivery(
        typeof method.estimatedDeliveryDays === 'object' && method.estimatedDeliveryDays !== null
          ? (method.estimatedDeliveryDays as { min?: number }).min ?? method.handlingDays ?? 3
          : method.handlingDays ?? 3
      ),
      cost: cost.baseRate,
      insurance: cost.insurance,
      labels: [],
    };

    // Generate shipping labels
    shipment.labels = await this.generateLabels(shipment, fromAddress, toAddress, packages);

    return shipment;
  }

  /**
   * Get tracking information
   */
  async getTrackingInfo(trackingNumber: string, carrierCode?: string): Promise<TrackingInfo> {
    // Determine carrier from tracking number if not provided
    const carrier = carrierCode || this.determineCarrierFromTrackingNumber(trackingNumber);

    if (!carrier) {
      throw new Error('Unable to determine carrier from tracking number');
    }

    // Carrier tracking API integration would go here
    // For now, return mock tracking info
    logger.info(`getTrackingInfo: returning mock tracking for ${trackingNumber} via ${carrier}`);
    return {
      trackingNumber,
      carrier,
      status: 'in_transit',
      statusDetails: 'Package is in transit',
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      events: [
        {
          date: new Date().toISOString().split('T')[0],
          time: '09:00',
          location: 'Shipping Facility',
          description: 'Package has been picked up',
          status: 'picked_up',
        },
        {
          date: new Date().toISOString().split('T')[0],
          time: '14:30',
          location: 'Sorting Facility',
          description: 'Package is being sorted',
          status: 'in_transit',
        },
      ],
    };
  }

  /**
   * Generate shipping label
   */
  async generateLabel(_shipmentId: string, format: 'pdf' | 'png' | 'zpl' = 'pdf'): Promise<ShippingLabel> {
    // Generate shipping label — carrier API integration would go here
    // For now, return mock label
    logger.info(`generateLabel: generating mock ${format} label for shipment ${_shipmentId}`);
    return {
      type: 'shipping',
      format,
      data: 'base64-encoded-label-data-would-go-here',
      trackingNumber: `TRK${Date.now()}`,
    };
  }

  /**
   * Get shipping methods for a zone
   */
  async getShippingMethods(_zoneId: string): Promise<unknown[]> {
    try {
      // Return all active shipping methods (simplified implementation)
      return await this.methodRepo.findAll(true);
    } catch {
      return [];
    }
  }

  /**
   * Calculate shipping cost for a specific method
   */
  private async calculateMethodRate(
    method: ShippingMethod,
    packages: Package[],
    _zone: unknown,
    fromAddress: Address,
    toAddress: Address,
  ): Promise<{ total: number; baseRate: number; insurance: number } | null> {
    try {
      const ext = method as ShippingMethodExtended;
      // Calculate package dimensions and weight
      const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0);
      const totalValue = packages.reduce((sum, pkg) => sum + (pkg.value || 0), 0);

      // Get base rate from method/zone configuration
      let baseRate = ext.baseRate || 0;

      // Add weight-based charges
      if (ext.weightRate && totalWeight > (ext.freeWeight || 0)) {
        baseRate += (totalWeight - (ext.freeWeight || 0)) * ext.weightRate;
      }

      // Add distance-based charges (simplified)
      const distance = this.calculateDistance(fromAddress, toAddress);
      if (ext.distanceRate && distance > (ext.freeDistance || 0)) {
        baseRate += (distance - (ext.freeDistance || 0)) * ext.distanceRate;
      }

      // Calculate insurance (if included)
      let insurance = 0;
      if (ext.insuranceIncluded && totalValue > 0) {
        insurance = totalValue * 0.01; // 1% of declared value
      }

      const total = baseRate + insurance;

      return { total, baseRate, insurance };
    } catch {
      return null;
    }
  }

  /**
   * Calculate shipment cost (for internal use)
   */
  private async calculateShipmentCost(
    method: ShippingMethod,
    packages: Package[],
    fromAddress: Address,
    toAddress: Address,
  ): Promise<{ baseRate: number; insurance: number }> {
    const rate = await this.calculateMethodRate(method, packages, null, fromAddress, toAddress);
    return rate ? { baseRate: rate.baseRate, insurance: rate.insurance } : { baseRate: 0, insurance: 0 };
  }

  /**
   * Generate tracking number
   */
  private generateTrackingNumber(carrierCode: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${carrierCode}${timestamp}${random}`.toUpperCase();
  }

  /**
   * Determine carrier from tracking number format
   */
  private determineCarrierFromTrackingNumber(trackingNumber: string): string | null {
    // Simple pattern matching for common carriers
    if (/^1Z/.test(trackingNumber)) return 'UPS';
    if (/^\d{12,22}$/.test(trackingNumber)) return 'USPS';
    if (/^T\d{10,12}$/.test(trackingNumber)) return 'FedEx';
    if (/^940\d{13}$/.test(trackingNumber)) return 'DHL';

    return null; // Unknown carrier
  }

  /**
   * Calculate estimated delivery date
   */
  private calculateEstimatedDelivery(estimatedDays: number): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
    return deliveryDate.toISOString();
  }

  /**
   * Calculate distance between two addresses (simplified)
   */
  private calculateDistance(from: Address, to: Address): number {
    // Simplified distance calculation
    // In production, use proper geolocation services
    if (from.country === to.country && from.state === to.state) {
      return 50; // Same state, assume 50 miles
    } else if (from.country === to.country) {
      return 500; // Same country, different state, assume 500 miles
    } else {
      return 2000; // International, assume 2000 miles
    }
  }

  /**
   * Generate shipping labels
   */
  private async generateLabels(
    shipment: Shipment,
    fromAddress: Address,
    toAddress: Address,
    packages: Package[],
  ): Promise<ShippingLabel[]> {
    const labels: ShippingLabel[] = [];

    // Generate one label per package
    for (let i = 0; i < packages.length; i++) {
      const label = await this.generateLabel(shipment.shipmentId, 'pdf');
      labels.push(label);
    }

    return labels;
  }

  /**
   * Get carrier capabilities
   */
  async getCarrierCapabilities(carrierCode: string): Promise<unknown> {
    try {
      const carrier = await this.carrierRepo.findByCode(carrierCode);
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

  /**
   * Update shipment status
   */
  async updateShipmentStatus(shipmentId: string, status: string, trackingInfo?: TrackingInfo): Promise<void> {
    try {
      await query(
        `UPDATE "shipment" SET status = $1, "updatedAt" = now() WHERE "shipmentId" = $2`,
        [status, shipmentId],
      );
      if (trackingInfo) {
        logger.info(`updateShipmentStatus: updated shipment ${shipmentId} to ${status} with tracking info`);
      } else {
        logger.info(`updateShipmentStatus: updated shipment ${shipmentId} to ${status}`);
      }
    } catch (err: unknown) {
      logger.error(`updateShipmentStatus error: ${(err as Error).message}`);
    }
  }
}

export default new ShippingService();
