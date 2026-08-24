/**
 * Unit Tests for Fulfillment Entity
 */

import { Fulfillment, FulfillmentStatus } from './Fulfillment';
import { FulfillmentValidationError } from '../errors/FulfillmentErrors';

describe('Fulfillment', () => {
  function createFulfillment(status?: string): Fulfillment {
    return Fulfillment.fromPersistence({
      fulfillmentId: 'ful-1',
      orderId: 'ord-1',
      orderNumber: 'ORD-001',
      sourceType: 'warehouse',
      sourceId: 'wh-1',
      status: (status as FulfillmentStatus) || 'pending',
      shipFromAddress: { addressLine1: '123 Warehouse St', city: 'Portland', postalCode: '97201', countryCode: 'US' },
      shipToAddress: { addressLine1: '456 Customer Ave', city: 'Seattle', postalCode: '98101', countryCode: 'US' },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  }

  describe('create', () => {
    it('should create with pending status and generated ID', () => {
      const f = Fulfillment.create({
        orderId: 'ord-1',
        sourceType: 'warehouse',
        sourceId: 'wh-1',
        shipFromAddress: { addressLine1: '123 St', city: 'Portland', postalCode: '97201', countryCode: 'US' },
        shipToAddress: { addressLine1: '456 Ave', city: 'Seattle', postalCode: '98101', countryCode: 'US' },
      });

      expect(f.status).toBe('pending');
      expect(f.fulfillmentId).toBeDefined();
      expect(f.orderId).toBe('ord-1');
    });
  });

  describe('assign', () => {
    it('should set status to assigned', () => {
      const f = createFulfillment('pending');
      f.assign('organization', 'org-1');

      expect(f.status).toBe('assigned');
      expect(f.sourceType).toBe('organization');
      expect(f.sourceId).toBe('org-1');
      expect(f.assignedAt).toBeDefined();
    });
  });

  describe('startPicking', () => {
    it('should transition from pending to picking', () => {
      const f = createFulfillment('pending');
      f.startPicking();
      expect(f.status).toBe('picking');
    });

    it('should throw invalid transition from delivered', () => {
      const f = createFulfillment('delivered');
      expect(() => f.startPicking()).toThrow(FulfillmentValidationError);
    });
  });

  describe('completePicking', () => {
    it('should transition from picking to picked', () => {
      const f = createFulfillment('picking');
      f.completePicking();
      expect(f.status).toBe('picked');
      expect(f.pickedAt).toBeDefined();
    });
  });

  describe('startPacking', () => {
    it('should transition from picked to packing', () => {
      const f = createFulfillment('picked');
      f.startPacking();
      expect(f.status).toBe('packing');
    });
  });

  describe('completePacking', () => {
    it('should transition from packing to packed', () => {
      const f = createFulfillment('packing');
      f.completePacking(2.5, { length: 10, width: 20, height: 15 });
      expect(f.status).toBe('packed');
      expect(f.packedAt).toBeDefined();
      expect(f.weightGrams).toBe(2500);
    });

    it('should handle missing weight and dimensions', () => {
      const f = createFulfillment('packing');
      f.completePacking();
      expect(f.status).toBe('packed');
      expect(f.weightGrams).toBeUndefined();
    });
  });

  describe('markReadyToShip', () => {
    it('should transition from packed to ready_to_ship', () => {
      const f = createFulfillment('packed');
      f.markReadyToShip();
      expect(f.status).toBe('ready_to_ship');
    });
  });

  describe('ship', () => {
    it('should transition from ready_to_ship to shipped', () => {
      const f = createFulfillment('ready_to_ship');
      f.ship({ trackingNumber: 'TRK-123', carrierId: 'fedex', carrierName: 'FedEx' });
      expect(f.status).toBe('shipped');
      expect(f.trackingNumber).toBe('TRK-123');
      expect(f.carrierName).toBe('FedEx');
      expect(f.shippedAt).toBeDefined();
    });

    it('should throw invalid transition from pending', () => {
      const f = createFulfillment('pending');
      expect(() => f.ship({ trackingNumber: 'TRK-123' })).toThrow(FulfillmentValidationError);
    });
  });

  describe('updateTracking', () => {
    it('should update tracking number and URL', () => {
      const f = createFulfillment('shipped');
      f.updateTracking('TRK-999', 'https://track.example.com/TRK-999');
      expect(f.trackingNumber).toBe('TRK-999');
      expect(f.trackingUrl).toBe('https://track.example.com/TRK-999');
    });
  });

  describe('markInTransit', () => {
    it('should transition from shipped to in_transit', () => {
      const f = createFulfillment('shipped');
      f.markInTransit();
      expect(f.status).toBe('in_transit');
    });
  });

  describe('markOutForDelivery', () => {
    it('should transition from in_transit to out_for_delivery', () => {
      const f = createFulfillment('in_transit');
      f.markOutForDelivery();
      expect(f.status).toBe('out_for_delivery');
    });
  });

  describe('markDelivered', () => {
    it('should transition from out_for_delivery to delivered', () => {
      const f = createFulfillment('out_for_delivery');
      f.markDelivered();
      expect(f.status).toBe('delivered');
      expect(f.deliveredAt).toBeDefined();
    });
  });

  describe('markFailed', () => {
    it('should set status to failed with reason', () => {
      const f = createFulfillment('picking');
      f.markFailed('Item out of stock');
      expect(f.status).toBe('failed');
    });
  });

  describe('markReturned', () => {
    it('should transition from delivered to returned', () => {
      const f = createFulfillment('delivered');
      f.markReturned();
      expect(f.status).toBe('returned');
    });
  });

  describe('cancel', () => {
    it('should cancel from pending', () => {
      const f = createFulfillment('pending');
      f.cancel();
      expect(f.status).toBe('cancelled');
    });

    it('should cancel from picking', () => {
      const f = createFulfillment('picking');
      f.cancel();
      expect(f.status).toBe('cancelled');
    });

    it('should throw when cancelling delivered', () => {
      const f = createFulfillment('delivered');
      expect(() => f.cancel()).toThrow(FulfillmentValidationError);
    });
  });

  describe('canCancel', () => {
    it('should return true for pending', () => {
      const f = createFulfillment('pending');
      expect(f.canCancel()).toBe(true);
    });

    it('should return false for delivered', () => {
      const f = createFulfillment('delivered');
      expect(f.canCancel()).toBe(false);
    });

    it('should return false for cancelled', () => {
      const f = createFulfillment('cancelled');
      expect(f.canCancel()).toBe(false);
    });
  });

  describe('isComplete', () => {
    it('should return true for delivered', () => {
      const f = createFulfillment('delivered');
      expect(f.isComplete()).toBe(true);
    });

    it('should return true for cancelled', () => {
      const f = createFulfillment('cancelled');
      expect(f.isComplete()).toBe(true);
    });

    it('should return false for pending', () => {
      const f = createFulfillment('pending');
      expect(f.isComplete()).toBe(false);
    });
  });

  describe('toPersistence', () => {
    it('should return plain object', () => {
      const f = createFulfillment('pending');
      const obj = f.toPersistence();

      expect(obj.fulfillmentId).toBe('ful-1');
      expect(obj.orderId).toBe('ord-1');
      expect(obj.status).toBe('pending');
    });
  });
});
