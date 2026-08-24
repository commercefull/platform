import { OrderItem } from './OrderItem';
import { Money } from '../valueObjects/Money';
import { FulfillmentStatus } from '../valueObjects/FulfillmentStatus';
import { QuantityMustBeAtLeastOneError } from '../errors/OrderErrors';

describe('OrderItem', () => {
  const baseProps = {
    orderItemId: 'item-1',
    orderId: 'order-1',
    productId: 'prod-1',
    sku: 'SKU-001',
    name: 'Test Product',
    quantity: 2,
    unitPrice: Money.create(50, 'USD'),
  };

  describe('create', () => {
    it('should create an order item with correct defaults', () => {
      const item = OrderItem.create(baseProps);

      expect(item.orderItemId).toBe('item-1');
      expect(item.orderId).toBe('order-1');
      expect(item.quantity).toBe(2);
      expect(item.fulfillmentStatus).toBe(FulfillmentStatus.UNFULFILLED);
      expect(item.taxExempt).toBe(false);
      expect(item.giftWrapped).toBe(false);
      expect(item.isDigital).toBe(false);
    });

    it('should calculate lineTotal from effective price × quantity', () => {
      const item = OrderItem.create(baseProps);
      expect(item.lineTotal.amount).toBe(100);
    });

    it('should use discountedUnitPrice for lineTotal when provided', () => {
      const item = OrderItem.create({
        ...baseProps,
        discountedUnitPrice: Money.create(40, 'USD'),
      });

      expect(item.lineTotal.amount).toBe(80);
      expect(item.discountTotal.amount).toBe(20);
    });

    it('should calculate tax from taxRate', () => {
      const item = OrderItem.create({
        ...baseProps,
        taxRate: 10,
      });

      expect(item.taxTotal.amount).toBe(10);
    });

    it('should default taxTotal to zero when no taxRate', () => {
      const item = OrderItem.create(baseProps);
      expect(item.taxTotal.amount).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity and recalculate totals', () => {
      const item = OrderItem.create(baseProps);
      item.updateQuantity(5);

      expect(item.quantity).toBe(5);
      expect(item.lineTotal.amount).toBe(250);
    });

    it('should throw QuantityMustBeAtLeastOneError when quantity < 1', () => {
      const item = OrderItem.create(baseProps);

      expect(() => item.updateQuantity(0)).toThrow(QuantityMustBeAtLeastOneError);
    });
  });

  describe('updateFulfillmentStatus', () => {
    it('should update fulfillment status', () => {
      const item = OrderItem.create(baseProps);
      item.updateFulfillmentStatus(FulfillmentStatus.FULFILLED);

      expect(item.fulfillmentStatus).toBe(FulfillmentStatus.FULFILLED);
    });
  });

  describe('total (computed)', () => {
    it('should return lineTotal + taxTotal', () => {
      const item = OrderItem.create({ ...baseProps, taxRate: 10 });
      expect(item.total.amount).toBe(110);
    });
  });

  describe('toJSON', () => {
    it('should serialize to a plain object', () => {
      const item = OrderItem.create(baseProps);
      const json = item.toJSON();

      expect(json.orderItemId).toBe('item-1');
      expect(json.unitPrice).toBe(50);
      expect(json.lineTotal).toBe(100);
      expect(json.fulfillmentStatus).toBe(FulfillmentStatus.UNFULFILLED);
    });
  });
});
