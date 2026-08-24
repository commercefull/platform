/**
 * Unit Tests for FulfillmentItem Entity
 */

import { FulfillmentItem } from './FulfillmentItem';
import { FulfillmentValidationError } from '../errors/FulfillmentErrors';

describe('FulfillmentItem', () => {
  function createItem(): FulfillmentItem {
    return FulfillmentItem.fromPersistence({
      fulfillmentItemId: 'item-1',
      fulfillmentId: 'ful-1',
      orderItemId: 'oi-1',
      productId: 'prod-1',
      sku: 'SKU-001',
      name: 'Test Product',
      quantityOrdered: 10,
      quantityFulfilled: 0,
      isPicked: false,
      isPacked: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  }

  describe('create', () => {
    it('should create with defaults', () => {
      const item = FulfillmentItem.create({
        fulfillmentId: 'ful-1',
        orderItemId: 'oi-1',
        productId: 'prod-1',
        sku: 'SKU-001',
        name: 'Test Product',
        quantityOrdered: 5,
        quantityFulfilled: 0,
      });

      expect(item.isPicked).toBe(false);
      expect(item.isPacked).toBe(false);
      expect(item.quantityOrdered).toBe(5);
      expect(item.quantityFulfilled).toBe(0);
      expect(item.fulfillmentItemId).toBeDefined();
    });
  });

  describe('pick', () => {
    it('should mark item as picked with quantity', () => {
      const item = createItem();
      item.pick(10);

      expect(item.isPicked).toBe(true);
      expect(item.quantityPicked).toBe(10);
    });

    it('should store serial and lot numbers', () => {
      const item = createItem();
      item.pick(10, ['SN-1', 'SN-2'], ['LOT-A']);

      expect(item.isPicked).toBe(true);
    });

    it('should throw when picking more than ordered', () => {
      const item = createItem();
      expect(() => item.pick(15)).toThrow(FulfillmentValidationError);
    });
  });

  describe('pack', () => {
    it('should mark item as packed with quantity', () => {
      const item = createItem();
      item.pick(10);
      item.pack(10);

      expect(item.isPacked).toBe(true);
      expect(item.quantityPacked).toBe(10);
    });

    it('should throw when packing more than picked', () => {
      const item = createItem();
      item.pick(5);
      expect(() => item.pack(10)).toThrow(FulfillmentValidationError);
    });

    it('should default to quantityOrdered when not yet picked', () => {
      const item = createItem();
      item.pack(10);

      expect(item.isPacked).toBe(true);
      expect(item.quantityPacked).toBe(10);
    });
  });

  describe('updateFulfilledQuantity', () => {
    it('should update fulfilled quantity', () => {
      const item = createItem();
      item.updateFulfilledQuantity(8);

      expect(item.quantityFulfilled).toBe(8);
    });
  });

  describe('setLocation', () => {
    it('should set warehouse and bin location', () => {
      const item = createItem();
      item.setLocation('WH-A', 'BIN-3');

      expect(item.warehouseLocation).toBe('WH-A');
      expect(item.binLocation).toBe('BIN-3');
    });
  });

  describe('toPersistence', () => {
    it('should return plain object', () => {
      const item = createItem();
      const obj = item.toPersistence();

      expect(obj.fulfillmentItemId).toBe('item-1');
      expect(obj.productId).toBe('prod-1');
      expect(obj.quantityOrdered).toBe(10);
    });
  });
});
