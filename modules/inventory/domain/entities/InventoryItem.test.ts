/**
 * Unit Tests for InventoryItem Entity
 */

import { InventoryItem } from './InventoryItem';
import {
  InventoryValidationError,
  InvalidStockQuantityError,
  InsufficientStockError,
} from '../errors/InventoryErrors';

describe('InventoryItem', () => {
  function createItem(overrides?: Partial<{ quantity: number; reservedQuantity: number; lowStockThreshold: number; reorderPoint: number }>): InventoryItem {
    return InventoryItem.reconstitute({
      inventoryId: 'inv-1',
      productId: 'prod-1',
      variantId: 'var-1',
      sku: 'SKU-001',
      locationId: 'loc-1',
      quantity: overrides?.quantity ?? 100,
      reservedQuantity: overrides?.reservedQuantity ?? 10,
      lowStockThreshold: overrides?.lowStockThreshold ?? 5,
      reorderPoint: overrides?.reorderPoint ?? 10,
      reorderQuantity: 50,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  }

  describe('create', () => {
    it('should create an inventory item with defaults', () => {
      const item = InventoryItem.create({
        inventoryId: 'inv-1',
        productId: 'prod-1',
        sku: 'SKU-001',
        locationId: 'loc-1',
      });

      expect(item.inventoryId).toBe('inv-1');
      expect(item.quantity).toBe(0);
      expect(item.reservedQuantity).toBe(0);
      expect(item.lowStockThreshold).toBe(5);
      expect(item.reorderPoint).toBe(10);
      expect(item.reorderQuantity).toBe(50);
      expect(item.availableQuantity).toBe(0);
    });

    it('should create with custom values', () => {
      const item = InventoryItem.create({
        inventoryId: 'inv-1',
        productId: 'prod-1',
        sku: 'SKU-001',
        locationId: 'loc-1',
        quantity: 50,
        lowStockThreshold: 3,
        reorderPoint: 8,
        reorderQuantity: 100,
      });

      expect(item.quantity).toBe(50);
      expect(item.lowStockThreshold).toBe(3);
      expect(item.reorderPoint).toBe(8);
      expect(item.reorderQuantity).toBe(100);
    });
  });

  describe('computed properties', () => {
    it('availableQuantity = quantity - reservedQuantity', () => {
      const item = createItem({ quantity: 100, reservedQuantity: 30 });
      expect(item.availableQuantity).toBe(70);
    });

    it('availableQuantity never goes negative', () => {
      const item = createItem({ quantity: 5, reservedQuantity: 10 });
      expect(item.availableQuantity).toBe(0);
    });

    it('isLowStock when available <= threshold', () => {
      const item = createItem({ quantity: 12, reservedQuantity: 5, lowStockThreshold: 10 });
      expect(item.availableQuantity).toBe(7);
      expect(item.isLowStock).toBe(true);
    });

    it('isOutOfStock when available <= 0', () => {
      const item = createItem({ quantity: 5, reservedQuantity: 5 });
      expect(item.isOutOfStock).toBe(true);
    });

    it('needsReorder when available <= reorderPoint', () => {
      const item = createItem({ quantity: 15, reservedQuantity: 5, reorderPoint: 10 });
      expect(item.availableQuantity).toBe(10);
      expect(item.needsReorder).toBe(true);
    });
  });

  describe('restock', () => {
    it('should increase quantity and set lastRestockAt', () => {
      const item = createItem({ quantity: 50 });
      item.restock(25);
      expect(item.quantity).toBe(75);
      expect(item.lastRestockAt).toBeDefined();
    });

    it('should throw for zero or negative quantity', () => {
      const item = createItem();
      expect(() => item.restock(0)).toThrow(InventoryValidationError);
      expect(() => item.restock(-5)).toThrow(InventoryValidationError);
    });
  });

  describe('sell', () => {
    it('should decrease quantity', () => {
      const item = createItem({ quantity: 100, reservedQuantity: 0 });
      item.sell(30);
      expect(item.quantity).toBe(70);
    });

    it('should throw InsufficientStockError when selling more than available', () => {
      const item = createItem({ quantity: 10, reservedQuantity: 5 });
      expect(() => item.sell(10)).toThrow(InsufficientStockError);
    });
  });

  describe('returnStock', () => {
    it('should increase quantity', () => {
      const item = createItem({ quantity: 50 });
      item.returnStock(20);
      expect(item.quantity).toBe(70);
    });

    it('should throw for zero or negative', () => {
      const item = createItem();
      expect(() => item.returnStock(0)).toThrow(InventoryValidationError);
    });
  });

  describe('adjust', () => {
    it('should set quantity to new value', () => {
      const item = createItem({ quantity: 100, reservedQuantity: 10 });
      item.adjust(80);
      expect(item.quantity).toBe(80);
    });

    it('should throw for negative quantity', () => {
      const item = createItem();
      expect(() => item.adjust(-1)).toThrow(InvalidStockQuantityError);
    });

    it('should throw when adjusting below reserved quantity', () => {
      const item = createItem({ quantity: 100, reservedQuantity: 50 });
      expect(() => item.adjust(40)).toThrow(InventoryValidationError);
    });
  });

  describe('reserve', () => {
    it('should increase reservedQuantity', () => {
      const item = createItem({ quantity: 100, reservedQuantity: 10 });
      item.reserve(20);
      expect(item.reservedQuantity).toBe(30);
    });

    it('should throw InsufficientStockError when reserving more than available', () => {
      const item = createItem({ quantity: 10, reservedQuantity: 5 });
      expect(() => item.reserve(10)).toThrow(InsufficientStockError);
    });
  });

  describe('releaseReservation', () => {
    it('should decrease reservedQuantity', () => {
      const item = createItem({ quantity: 100, reservedQuantity: 30 });
      item.releaseReservation(10);
      expect(item.reservedQuantity).toBe(20);
    });

    it('should not go below zero', () => {
      const item = createItem({ quantity: 100, reservedQuantity: 5 });
      item.releaseReservation(20);
      expect(item.reservedQuantity).toBe(0);
    });
  });

  describe('fulfillReservation', () => {
    it('should decrease both reservedQuantity and quantity', () => {
      const item = createItem({ quantity: 100, reservedQuantity: 30 });
      item.fulfillReservation(20);
      expect(item.reservedQuantity).toBe(10);
      expect(item.quantity).toBe(80);
    });

    it('should not let reservedQuantity go below zero', () => {
      const item = createItem({ quantity: 100, reservedQuantity: 5 });
      item.fulfillReservation(10);
      expect(item.reservedQuantity).toBe(0);
      expect(item.quantity).toBe(90);
    });
  });

  describe('updateThresholds', () => {
    it('should update provided thresholds', () => {
      const item = createItem();
      item.updateThresholds({ lowStockThreshold: 3, reorderPoint: 7, reorderQuantity: 200 });
      expect(item.lowStockThreshold).toBe(3);
      expect(item.reorderPoint).toBe(7);
      expect(item.reorderQuantity).toBe(200);
    });

    it('should only update provided fields', () => {
      const item = createItem();
      item.updateThresholds({ reorderPoint: 20 });
      expect(item.lowStockThreshold).toBe(5);
      expect(item.reorderPoint).toBe(20);
      expect(item.reorderQuantity).toBe(50);
    });
  });

  describe('toJSON', () => {
    it('should return serialized object with computed fields', () => {
      const item = createItem({ quantity: 100, reservedQuantity: 30 });
      const json = item.toJSON();

      expect(json.inventoryId).toBe('inv-1');
      expect(json.quantity).toBe(100);
      expect(json.reservedQuantity).toBe(30);
      expect(json.availableQuantity).toBe(70);
      expect(json.isLowStock).toBe(false);
      expect(json.isOutOfStock).toBe(false);
      expect(json.needsReorder).toBe(false);
    });
  });
});
