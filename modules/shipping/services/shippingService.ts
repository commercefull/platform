import ShippingCarrierRepo from '../repos/shippingCarrierRepo';
import ShippingMethodRepo from '../repos/shippingMethodRepo';
import ShippingRateRepo from '../repos/shippingRateRepo';
import ShippingZoneRepo from '../repos/shippingZoneRepo';
import { generateUUID } from '../../../libs/uuid';

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
    try {
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
              estimatedDays: (method.estimatedDeliveryDays as any)?.min || method.handlingDays || 3,
              guaranteedDelivery: false, // Default value - not stored in interface
              trackingAvailable: true, // Default value - not stored in interface
              insuranceIncluded: rate.insurance > 0,
            });
          }
        } catch (error) {
          // Continue with other methods
        }
      }

      // 4. Sort by rate
      return quotes.sort((a, b) => a.rate - b.rate);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate shipping address
   */
  async validateAddress(address: Address): Promise<AddressValidationResult> {
    try {
      // Basic validation
      const messages: string[] = [];

      if (!address.street1) messages.push('Street address is required');
      if (!address.city) messages.push('City is required');
      if (!address.state) messages.push('State/Province is required');
      if (!address.postalCode) messages.push('Postal code is required');
      if (!address.country) messages.push('Country is required');

      // TODO: Integrate with carrier address validation APIs
      // For now, return basic validation
      return {
        valid: messages.length === 0,
        normalizedAddress: messages.length === 0 ? address : undefined,
        messages,
      };
    } catch (error) {
      return {
        valid: false,
        messages: ['Address validation failed'],
      };
    }
  }

  /**
   * Create shipment with carrier
   */
  async createShipment(
    orderId: string,
    fromAddress: Address,
    toAddress: Address,
    packages: Package[],
    carrierCode: string,
    serviceCode: string,
  ): Promise<Shipment> {
    try {
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
        estimatedDeliveryDate: this.calculateEstimatedDelivery((method.estimatedDeliveryDays as any)?.min || method.handlingDays || 3),
        cost: cost.baseRate,
        insurance: cost.insurance,
        labels: [],
      };

      // Generate shipping labels
      shipment.labels = await this.generateLabels(shipment, fromAddress, toAddress, packages);

      return shipment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get tracking information
   */
  async getTrackingInfo(trackingNumber: string, carrierCode?: string): Promise<TrackingInfo> {
    try {
      // Determine carrier from tracking number if not provided
      const carrier = carrierCode || this.determineCarrierFromTrackingNumber(trackingNumber);

      if (!carrier) {
        throw new Error('Unable to determine carrier from tracking number');
      }

      // TODO: Integrate with carrier tracking APIs
      // For now, return mock tracking info
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate shipping label
   */
  async generateLabel(shipmentId: string, format: 'pdf' | 'png' | 'zpl' = 'pdf'): Promise<ShippingLabel> {
    try {
      // TODO: Generate actual shipping label
      // For now, return mock label
      return {
        type: 'shipping',
        format,
        data: 'base64-encoded-label-data-would-go-here',
        trackingNumber: `TRK${Date.now()}`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get shipping methods for a zone
   */
  async getShippingMethods(zoneId: string): Promise<any[]> {
    try {
      // Return all active shipping methods (simplified implementation)
      return await this.methodRepo.findAll(true);
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate shipping cost for a specific method
   */
  private async calculateMethodRate(
    method: any,
    packages: Package[],
    zone: any,
    fromAddress: Address,
    toAddress: Address,
  ): Promise<{ total: number; baseRate: number; insurance: number } | null> {
    try {
      // Calculate package dimensions and weight
      const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0);
      const totalValue = packages.reduce((sum, pkg) => sum + (pkg.value || 0), 0);

      // Get base rate from method/zone configuration
      let baseRate = method.baseRate || 0;

      // Add weight-based charges
      if (method.weightRate && totalWeight > method.freeWeight) {
        baseRate += (totalWeight - method.freeWeight) * method.weightRate;
      }

      // Add distance-based charges (simplified)
      const distance = this.calculateDistance(fromAddress, toAddress);
      if (method.distanceRate && distance > method.freeDistance) {
        baseRate += (distance - method.freeDistance) * method.distanceRate;
      }

      // Calculate insurance (if included)
      let insurance = 0;
      if (method.insuranceIncluded && totalValue > 0) {
        insurance = totalValue * 0.01; // 1% of declared value
      }

      const total = baseRate + insurance;

      return { total, baseRate, insurance };
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate shipment cost (for internal use)
   */
  private async calculateShipmentCost(
    method: any,
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
  async getCarrierCapabilities(carrierCode: string): Promise<any> {
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
    } catch (error) {
      return {};
    }
  }

  /**
   * Update shipment status
   */
  async updateShipmentStatus(shipmentId: string, status: string, trackingInfo?: TrackingInfo): Promise<void> {
    try {
      // TODO: Update shipment status in database
    } catch (error) {
      throw error;
    }
  }
}

export default new ShippingService();
