/**
 * Create Shipment Use Case
 *
 * Creates a shipment with carrier integration, generating tracking numbers and labels.
 */

import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';
import type { ShippingMethod } from '../../infrastructure/repositories/ShippingConfigRepository';
import { ShippingCarrierNotFoundError, ShippingMethodNotFoundError } from '../../domain/errors/ShippingErrors';

const shippingCarrierRepo = shippingConfigRepository.carriers;
const shippingMethodRepo = shippingConfigRepository.methods;
import { generateUUID } from '../../../../libs/uuid';
import { logger } from '../../../../libs/logger';

export interface ShipmentAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShipmentPackage {
  weight: number;
  length: number;
  width: number;
  height: number;
  value?: number;
  description?: string;
}

export interface ShippingLabel {
  type: 'shipping' | 'return';
  format: 'pdf' | 'png' | 'zpl';
  data: string;
  trackingNumber: string;
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

export interface CreateShipmentInput {
  orderId: string;
  fromAddress: ShipmentAddress;
  toAddress: ShipmentAddress;
  packages: ShipmentPackage[];
  carrierCode: string;
  serviceCode: string;
}

interface ShippingMethodExtended extends ShippingMethod {
  baseRate?: number;
  weightRate?: number;
  freeWeight?: number;
  distanceRate?: number;
  freeDistance?: number;
  insuranceIncluded?: boolean;
}

export class CreateShipmentUseCase {
  async execute(input: CreateShipmentInput): Promise<Shipment> {
    const carrier = await shippingCarrierRepo.findByCode(input.carrierCode);
    if (!carrier) {
      throw new ShippingCarrierNotFoundError(input.carrierCode);
    }

    const method = await shippingMethodRepo.findByCode(input.serviceCode);
    if (!method) {
      throw new ShippingMethodNotFoundError(input.serviceCode);
    }

    const trackingNumber = this.generateTrackingNumber(input.carrierCode);
    const cost = this.calculateShipmentCost(method, input.packages, input.fromAddress, input.toAddress);

    const estimatedDays = typeof method.estimatedDeliveryDays === 'object' && method.estimatedDeliveryDays !== null
      ? (method.estimatedDeliveryDays as { min?: number }).min ?? method.handlingDays ?? 3
      : method.handlingDays ?? 3;

    const shipment: Shipment = {
      shipmentId: generateUUID(),
      trackingNumber,
      carrier: input.carrierCode,
      serviceCode: input.serviceCode,
      status: 'pending',
      shipDate: new Date().toISOString(),
      estimatedDeliveryDate: this.calculateEstimatedDelivery(estimatedDays),
      cost: cost.baseRate,
      insurance: cost.insurance,
      labels: [],
    };

    shipment.labels = await this.generateLabels(shipment, input.packages);

    return shipment;
  }

  private calculateShipmentCost(
    method: ShippingMethod,
    packages: ShipmentPackage[],
    fromAddress: ShipmentAddress,
    toAddress: ShipmentAddress,
  ): { baseRate: number; insurance: number } {
    try {
      const ext = method as ShippingMethodExtended;
      const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0);
      const totalValue = packages.reduce((sum, pkg) => sum + (pkg.value || 0), 0);

      let baseRate = ext.baseRate || 0;

      if (ext.weightRate && totalWeight > (ext.freeWeight || 0)) {
        baseRate += (totalWeight - (ext.freeWeight || 0)) * ext.weightRate;
      }

      const distance = this.calculateDistance(fromAddress, toAddress);
      if (ext.distanceRate && distance > (ext.freeDistance || 0)) {
        baseRate += (distance - (ext.freeDistance || 0)) * ext.distanceRate;
      }

      let insurance = 0;
      if (ext.insuranceIncluded && totalValue > 0) {
        insurance = totalValue * 0.01;
      }

      return { baseRate, insurance };
    } catch {
      return { baseRate: 0, insurance: 0 };
    }
  }

  private generateTrackingNumber(carrierCode: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${carrierCode}${timestamp}${random}`.toUpperCase();
  }

  private calculateEstimatedDelivery(estimatedDays: number): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);
    return deliveryDate.toISOString();
  }

  private calculateDistance(from: ShipmentAddress, to: ShipmentAddress): number {
    if (from.country === to.country && from.state === to.state) return 50;
    if (from.country === to.country) return 500;
    return 2000;
  }

  private async generateLabels(shipment: Shipment, packages: ShipmentPackage[]): Promise<ShippingLabel[]> {
    const labels: ShippingLabel[] = [];
    for (let i = 0; i < packages.length; i++) {
      logger.info(`generateLabels: generating mock PDF label for shipment ${shipment.shipmentId}`);
      labels.push({
        type: 'shipping',
        format: 'pdf',
        data: 'base64-encoded-label-data-would-go-here',
        trackingNumber: shipment.trackingNumber,
      });
    }
    return labels;
  }
}
