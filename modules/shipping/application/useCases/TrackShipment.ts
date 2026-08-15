/**
 * Track Shipment Use Case
 *
 * Retrieves tracking information for a shipment.
 */

import shippingLabelRepo from '../../infrastructure/repositories/shippingLabelRepo';

export interface TrackShipmentInput {
  trackingNumber?: string;
  shippingLabelId?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  carrierName?: string;
  labelUrl?: string;
  shippingLabelId: string;
  createdAt: Date;
  voidedAt?: Date;
}

export class TrackShipmentUseCase {
  async execute(input: TrackShipmentInput): Promise<{ found: boolean; tracking: TrackingInfo | null }> {
    let label = null;

    if (input.shippingLabelId) {
      label = await shippingLabelRepo.findById(input.shippingLabelId);
    } else if (input.trackingNumber) {
      label = await shippingLabelRepo.findByTrackingNumber(input.trackingNumber);
    }

    if (!label) {
      return { found: false, tracking: null };
    }

    return {
      found: true,
      tracking: {
        trackingNumber: label.trackingNumber,
        status: label.status,
        carrierName: label.carrierName,
        labelUrl: label.labelUrl,
        shippingLabelId: label.shippingLabelId,
        createdAt: label.createdAt,
        voidedAt: label.voidedAt,
      },
    };
  }
}

export const trackShipmentUseCase = new TrackShipmentUseCase();
