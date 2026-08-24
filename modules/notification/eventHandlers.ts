import { eventBus, EventPayload } from '../../libs/events/eventBus';
import { JobScheduler } from '../../libs/jobs/cronScheduler';
import { query } from '../../libs/db';
import { logger } from '../../libs/logger';

// Event payload interfaces
interface OrderCreatedPayload {
  orderId: string;
  customerId: string;
  orderNumber: string;
  total: number;
}

interface OrderPaidPayload {
  orderId: string;
  customerId: string;
  orderNumber: string;
  amount: number;
  transactionId: string;
}

interface OrderShippedPayload {
  orderId: string;
  customerId: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
}

interface OrderCompletedPayload {
  orderId: string;
  customerId: string;
  orderNumber: string;
}

interface OrderCancelledPayload {
  orderId: string;
  customerId: string;
  orderNumber: string;
  reason: string;
}

interface OrderRefundedPayload {
  orderId: string;
  customerId: string;
  orderNumber: string;
  amount: number;
  reason: string;
}

interface OrderReadyForPickupPayload {
  orderId: string;
  orderNumber: string;
  pickupLocationId: string;
  pickupLocationName: string;
  customerId: string;
  customerEmail: string;
}

interface PaymentReceivedPayload {
  orderId: string;
  amount: number;
  transactionId: string;
}

interface PaymentFailedPayload {
  orderId: string;
  customerId: string;
  amount: number;
  reason: string;
}

interface InventoryLowPayload {
  productId: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
}

interface InventoryOutOfStockPayload {
  productId: string;
  sku: string;
}

interface InventoryReservedPayload {
  productId: string;
  quantity: number;
  orderId: string;
  cartId: string;
}

interface InventoryReleasedPayload {
  productId: string;
  quantity: number;
  reason: string;
}

interface CustomerRegisteredPayload {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface CustomerUpdatedPayload {
  customerId: string;
  changes: Record<string, unknown>;
}

interface SupplierCreatedPayload {
  supplierId: string;
  name: string;
  email: string;
}

interface SupplierApprovedPayload {
  supplierId: string;
  name: string;
  email: string;
}

interface PurchaseOrderCreatedPayload {
  purchaseOrderId: string;
  supplierId: string;
  poNumber: string;
  supplierEmail: string;
}

interface PurchaseOrderApprovedPayload {
  purchaseOrderId: string;
  poNumber: string;
  supplierEmail: string;
}

interface ReceivingCompletedPayload {
  receivingRecordId: string;
  purchaseOrderId: string;
  receiptNumber: string;
}

// Event handlers for order events
export const registerOrderEventHandlers = () => {
  // Order created event
  eventBus.registerHandler('order.created', async (payload: EventPayload) => {
    const { orderId, customerId, orderNumber, total } = payload.data as OrderCreatedPayload;

    // Send order confirmation notification
    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'order_confirmation',
      title: 'Order Confirmed',
      message: `Your order ${orderNumber} has been confirmed.`,
      data: { orderId, orderNumber, total },
    });

    // Send order confirmation email
    const customerRow = await query<Array<{ email: string }>>(`SELECT email FROM customer WHERE "customerId" = $1`, [customerId]);
    const customerEmail = customerRow?.[0]?.email;
    if (customerEmail) {
      await JobScheduler.scheduleEmail({
        to: customerEmail,
        subject: `Order Confirmation - ${orderNumber}`,
        template: 'order-confirmation',
        data: { orderId, orderNumber, total },
      });
    }
  });

  // Order paid event
  eventBus.registerHandler('order.paid', async (payload: EventPayload) => {
    const { orderId, customerId, orderNumber, amount, transactionId } = payload.data as OrderPaidPayload;

    // Send payment confirmation notification
    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'payment_confirmation',
      title: 'Payment Confirmed',
      message: `Payment of $${amount} for order ${orderNumber} has been processed.`,
      data: { orderId, orderNumber, amount, transactionId },
    });
  });

  // Order shipped event
  eventBus.registerHandler('order.shipped', async (payload: EventPayload) => {
    const { orderId, customerId, orderNumber, trackingNumber, carrier } = payload.data as OrderShippedPayload;

    // Send shipping notification
    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'order_shipped',
      title: 'Order Shipped',
      message: `Your order ${orderNumber} has been shipped.`,
      data: { orderId, orderNumber, trackingNumber, carrier },
      channels: ['email', 'push', 'in_app'],
    });
  });

  // Order completed event
  eventBus.registerHandler('order.completed', async (payload: EventPayload) => {
    const { orderId, customerId, orderNumber } = payload.data as OrderCompletedPayload;

    // Send order completion notification
    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'order_completed',
      title: 'Order Delivered',
      message: `Your order ${orderNumber} has been delivered successfully.`,
      data: { orderId, orderNumber },
    });
  });

  // Order cancelled event
  eventBus.registerHandler('order.cancelled', async (payload: EventPayload) => {
    const { orderId, customerId, orderNumber, reason } = payload.data as OrderCancelledPayload;

    // Send cancellation notification
    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Your order ${orderNumber} has been cancelled. Reason: ${reason}`,
      data: { orderId, orderNumber, reason },
    });
  });

  // Order refunded event
  eventBus.registerHandler('order.refunded', async (payload: EventPayload) => {
    const { orderId, customerId, orderNumber, amount, reason } = payload.data as OrderRefundedPayload;

    // Send refund notification
    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'refund_processed',
      title: 'Refund Processed',
      message: `A refund of $${amount} has been processed for order ${orderNumber}.`,
      data: { orderId, orderNumber, amount, reason },
    });
  });

  // Order ready for pickup event (BOPIS)
  eventBus.registerHandler('order.ready_for_pickup', async (payload: EventPayload) => {
    const { orderId, orderNumber, pickupLocationId, pickupLocationName, customerId, customerEmail } = payload.data as OrderReadyForPickupPayload;

    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'order_ready_for_pickup',
      title: 'Order Ready for Pickup',
      message: `Your order ${orderNumber} is ready for pickup at ${pickupLocationName}.`,
      data: { orderId, orderNumber, pickupLocationId, pickupLocationName },
      channels: ['email', 'push', 'in_app'],
    });

    if (customerEmail) {
      await JobScheduler.scheduleEmail({
        to: customerEmail,
        subject: `Order Ready for Pickup - ${orderNumber}`,
        template: 'order-ready-for-pickup',
        data: { orderId, orderNumber, pickupLocationName },
      });
    }
  });
};

// Event handlers for payment events
export const registerPaymentEventHandlers = () => {
  eventBus.registerHandler('payment.received', async (payload: EventPayload) => {
    const { orderId, amount, transactionId } = payload.data as PaymentReceivedPayload;

    // Emit order paid event
    await eventBus.emit('order.paid', {
      orderId,
      amount,
      transactionId,
    });
  });

  eventBus.registerHandler('payment.failed', async (payload: EventPayload) => {
    const { orderId, customerId, amount, reason } = payload.data as PaymentFailedPayload;

    // Send payment failure notification
    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Payment of $${amount} could not be processed. Please try again.`,
      data: { orderId, amount, reason },
    });
  });
};

// Event handlers for inventory events
export const registerInventoryEventHandlers = () => {
  eventBus.registerHandler('inventory.low', async (payload: EventPayload) => {
    const { productId, sku, currentStock, reorderPoint } = payload.data as InventoryLowPayload;

    logger.warning('Low inventory alert', { sku, currentStock, reorderPoint });

    // Send low stock notification to merchants who carry this product
    const merchants = await query<Array<{ organizationId: string }>>(
      `SELECT DISTINCT m."organizationId" FROM "organization" m JOIN product p ON p."organizationId" = m."organizationId" WHERE p."productId" = $1 AND m.status = 'active'`,
      [productId],
    );

    for (const merchant of merchants || []) {
      await JobScheduler.scheduleNotification({
        userId: merchant.organizationId,
        type: 'low_stock_alert',
        title: 'Low Stock Alert',
        message: `Product ${sku} is running low on stock (${currentStock} remaining, reorder at ${reorderPoint}).`,
        data: { productId, sku, currentStock, reorderPoint },
      });
    }
  });

  eventBus.registerHandler('inventory.out_of_stock', async (payload: EventPayload) => {
    const { productId, sku } = payload.data as InventoryOutOfStockPayload;

    // Send out of stock notification to merchants who carry this product
    const merchants = await query<Array<{ organizationId: string }>>(
      `SELECT DISTINCT m."organizationId" FROM "organization" m JOIN product p ON p."organizationId" = m."organizationId" WHERE p."productId" = $1 AND m.status = 'active'`,
      [productId],
    );

    for (const merchant of merchants || []) {
      await JobScheduler.scheduleNotification({
        userId: merchant.organizationId,
        type: 'out_of_stock_alert',
        title: 'Out of Stock Alert',
        message: `Product ${sku} is now out of stock.`,
        data: { productId, sku },
      });
    }
  });

  eventBus.registerHandler('inventory.reserved', async (payload: EventPayload) => {
    const { productId: _productId, quantity: _quantity, orderId: _orderId, cartId: _cartId } = payload.data as InventoryReservedPayload;
  });

  eventBus.registerHandler('inventory.released', async (payload: EventPayload) => {
    const { productId, quantity, reason } = payload.data as InventoryReleasedPayload;

    logger.debug('Inventory released', { productId, quantity, reason });
  });
};

// Event handlers for customer events
export const registerCustomerEventHandlers = () => {
  eventBus.registerHandler('customer.registered', async (payload: EventPayload) => {
    const { customerId, email, firstName, lastName } = payload.data as CustomerRegisteredPayload;

    // Send welcome notification
    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'welcome',
      title: 'Welcome to CommerceFull!',
      message: `Welcome ${firstName}! Thank you for joining us.`,
      data: { customerId, email },
    });

    // Send welcome email
    await JobScheduler.scheduleEmail({
      to: email,
      subject: 'Welcome to CommerceFull!',
      template: 'welcome-email',
      data: { firstName, lastName },
    });
  });

  eventBus.registerHandler('customer.updated', async (payload: EventPayload) => {
    const { customerId: _customerId, changes: _changes } = payload.data as CustomerUpdatedPayload;

    // Invalidate customer cache if needed
    logger.info(`customer.updated: invalidating cache for customer ${_customerId}`);
  });
};

// Event handlers for supplier events
export const registerSupplierEventHandlers = () => {
  eventBus.registerHandler('supplier.created', async (payload: EventPayload) => {
    const { supplierId, name, email } = payload.data as SupplierCreatedPayload;

    // Send supplier welcome email
    await JobScheduler.scheduleEmail({
      to: email,
      subject: 'Welcome to CommerceFull Supplier Network',
      template: 'supplier-welcome',
      data: { supplierId, name },
    });
  });

  eventBus.registerHandler('supplier.approved', async (payload: EventPayload) => {
    const { supplierId, name, email } = payload.data as SupplierApprovedPayload;

    // Send approval notification
    await JobScheduler.scheduleEmail({
      to: email,
      subject: 'Supplier Account Approved',
      template: 'supplier-approved',
      data: { supplierId, name },
    });
  });

  eventBus.registerHandler('purchase_order.created', async (payload: EventPayload) => {
    const { purchaseOrderId, supplierId: _supplierId, poNumber, supplierEmail } = payload.data as PurchaseOrderCreatedPayload;

    // Send PO to supplier
    await JobScheduler.scheduleEmail({
      to: supplierEmail,
      subject: `Purchase Order ${poNumber}`,
      template: 'purchase-order',
      data: { purchaseOrderId, poNumber },
    });
  });

  eventBus.registerHandler('purchase_order.approved', async (payload: EventPayload) => {
    const { purchaseOrderId, poNumber, supplierEmail } = payload.data as PurchaseOrderApprovedPayload;

    // Notify supplier of approval
    await JobScheduler.scheduleEmail({
      to: supplierEmail,
      subject: `Purchase Order ${poNumber} Approved`,
      template: 'po-approved',
      data: { purchaseOrderId, poNumber },
    });
  });

  eventBus.registerHandler('receiving.completed', async (payload: EventPayload) => {
    const { receivingRecordId: _receivingRecordId, purchaseOrderId: _purchaseOrderId, receiptNumber: _receiptNumber } = payload.data as ReceivingCompletedPayload;

    // Update inventory and send notifications
    logger.info(`receiving.completed: triggering inventory update for PO ${_purchaseOrderId} (receipt ${_receiptNumber})`);
  });
};

// Register all event handlers
export const registerAllEventHandlers = () => {
  registerOrderEventHandlers();
  registerPaymentEventHandlers();
  registerInventoryEventHandlers();
  registerCustomerEventHandlers();
  registerSupplierEventHandlers();
};

// Initialize event handlers when the module is imported
registerAllEventHandlers();
