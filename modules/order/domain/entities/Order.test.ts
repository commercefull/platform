import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { Money } from '../valueObjects/Money';
import { OrderStatus } from '../valueObjects/OrderStatus';
import { PaymentStatus } from '../valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../valueObjects/FulfillmentStatus';
import {
  OrderItemNotFoundError,
  InvalidOrderTransitionError,
  InvalidPaymentTransitionError,
  OrderCannotBeCancelledError,
  OrderCannotBeModifiedError,
} from '../errors/OrderErrors';

function createItem(id: string, qty: number, price: number): OrderItem {
  return OrderItem.create({
    orderItemId: id,
    orderId: 'order-1',
    productId: 'prod-1',
    sku: 'SKU-001',
    name: 'Test Product',
    quantity: qty,
    unitPrice: Money.create(price, 'USD'),
  });
}

describe('Order', () => {
  describe('create', () => {
    it('should create an order with default values', () => {
      const order = Order.create({
        orderId: 'order-1',
        customerEmail: 'test@example.com',
      });

      expect(order.orderId).toBe('order-1');
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(order.fulfillmentStatus).toBe(FulfillmentStatus.UNFULFILLED);
      expect(order.currencyCode).toBe('USD');
      expect(order.orderSource).toBe('web');
      expect(order.totalAmount.amount).toBe(0);
      expect(order.items).toHaveLength(0);
    });

    it('should generate an order number if not provided', () => {
      const order = Order.create({
        orderId: 'order-1',
        customerEmail: 'test@example.com',
      });

      expect(order.orderNumber).toMatch(/^ORD-/);
    });

    it('should use provided order number', () => {
      const order = Order.create({
        orderId: 'order-1',
        orderNumber: 'ORD-CUSTOM-001',
        customerEmail: 'test@example.com',
      });

      expect(order.orderNumber).toBe('ORD-CUSTOM-001');
    });
  });

  describe('addItem', () => {
    it('should add an item and recalculate totals', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.addItem(createItem('i-1', 2, 50));

      expect(order.items).toHaveLength(1);
      expect(order.totalItems).toBe(1);
      expect(order.totalQuantity).toBe(2);
      expect(order.subtotal.amount).toBe(100);
      expect(order.totalAmount.amount).toBe(100);
    });

    it('should throw OrderCannotBeModifiedError when order is cancelled', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.cancel('test');

      expect(() => order.addItem(createItem('i-1', 1, 10))).toThrow(OrderCannotBeModifiedError);
    });
  });

  describe('removeItem', () => {
    it('should remove an item and recalculate', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.addItem(createItem('i-1', 2, 50));
      order.addItem(createItem('i-2', 1, 30));

      order.removeItem('i-1');

      expect(order.items).toHaveLength(1);
      expect(order.totalItems).toBe(1);
      expect(order.subtotal.amount).toBe(30);
    });

    it('should throw OrderItemNotFoundError for unknown item', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.addItem(createItem('i-1', 1, 10));

      expect(() => order.removeItem('nonexistent')).toThrow(OrderItemNotFoundError);
    });
  });

  describe('updateStatus', () => {
    it('should transition from PENDING to PROCESSING', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.updateStatus(OrderStatus.PROCESSING);

      expect(order.status).toBe(OrderStatus.PROCESSING);
    });

    it('should throw InvalidOrderTransitionError for invalid transition', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.updateStatus(OrderStatus.PROCESSING);
      order.updateStatus(OrderStatus.SHIPPED);
      order.updateStatus(OrderStatus.DELIVERED);
      order.updateStatus(OrderStatus.COMPLETED);

      expect(() => order.updateStatus(OrderStatus.PROCESSING)).toThrow(InvalidOrderTransitionError);
    });

    it('should set completedAt when status is COMPLETED', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.updateStatus(OrderStatus.PROCESSING);
      order.updateStatus(OrderStatus.SHIPPED);
      order.updateStatus(OrderStatus.DELIVERED);
      order.updateStatus(OrderStatus.COMPLETED);

      expect(order.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should transition from PENDING to PAID', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.updatePaymentStatus(PaymentStatus.PAID);

      expect(order.paymentStatus).toBe(PaymentStatus.PAID);
      expect(order.isPaid).toBe(true);
    });

    it('should throw InvalidPaymentTransitionError for invalid transition', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.updatePaymentStatus(PaymentStatus.PAID);
      order.updatePaymentStatus(PaymentStatus.REFUNDED);

      expect(() => order.updatePaymentStatus(PaymentStatus.PAID)).toThrow(InvalidPaymentTransitionError);
    });
  });

  describe('updateFulfillmentStatus', () => {
    it('should transition from UNFULFILLED to FULFILLED', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.updateFulfillmentStatus(FulfillmentStatus.FULFILLED);

      expect(order.fulfillmentStatus).toBe(FulfillmentStatus.FULFILLED);
      expect(order.isFulfilled).toBe(true);
    });
  });

  describe('cancel', () => {
    it('should cancel a pending order', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.cancel('customer request');

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.cancelledAt).toBeInstanceOf(Date);
      expect(order.isCancelled).toBe(true);
    });

    it('should throw OrderCannotBeCancelledError for completed order', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.updateStatus(OrderStatus.PROCESSING);
      order.updateStatus(OrderStatus.SHIPPED);
      order.updateStatus(OrderStatus.DELIVERED);
      order.updateStatus(OrderStatus.COMPLETED);

      expect(() => order.cancel('test')).toThrow(OrderCannotBeCancelledError);
    });
  });

  describe('canBeCancelled', () => {
    it('should be true for PENDING', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      expect(order.canBeCancelled).toBe(true);
    });

    it('should be false for COMPLETED', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.updateStatus(OrderStatus.PROCESSING);
      order.updateStatus(OrderStatus.SHIPPED);
      order.updateStatus(OrderStatus.DELIVERED);
      order.updateStatus(OrderStatus.COMPLETED);
      expect(order.canBeCancelled).toBe(false);
    });
  });

  describe('canBeRefunded', () => {
    it('should be true when order is PROCESSING and paid', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.updateStatus(OrderStatus.PROCESSING);
      order.updatePaymentStatus(PaymentStatus.PAID);

      expect(order.canBeRefunded).toBe(true);
    });

    it('should be false when not paid', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.updateStatus(OrderStatus.PROCESSING);
      expect(order.canBeRefunded).toBe(false);
    });
  });

  describe('setShippingTotal', () => {
    it('should set shipping total and recalculate', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.addItem(createItem('i-1', 2, 50));
      order.setShippingTotal(Money.create(15, 'USD'));

      expect(order.shippingTotal.amount).toBe(15);
      expect(order.totalAmount.amount).toBe(115);
    });
  });

  describe('addAdminNote', () => {
    it('should append a note with timestamp', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.addAdminNote('First note');

      expect(order.adminNotes).toContain('First note');
    });
  });

  describe('toJSON', () => {
    it('should serialize to a plain object', () => {
      const order = Order.create({ orderId: 'o-1', customerEmail: 't@e.com' });
      order.addItem(createItem('i-1', 2, 50));
      const json = order.toJSON();

      expect(json.orderId).toBe('o-1');
      expect(json.status).toBe(OrderStatus.PENDING);
      expect(json.totalAmount).toBe(100);
      expect(json.items).toHaveLength(1);
    });
  });
});
