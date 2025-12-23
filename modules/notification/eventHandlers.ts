import { eventBus, EventPayload, EventType } from '../../libs/events/eventBus';
import { JobScheduler } from '../../libs/jobs/cronScheduler';

// Event handlers for order events
export const registerOrderEventHandlers = () => {
  // Order created event
  eventBus.registerHandler('order.created', async (payload: EventPayload) => {
    const { orderId, customerId, orderNumber, total } = payload.data;

    // Send order confirmation notification
    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'order_confirmation',
      title: 'Order Confirmed',
      message: `Your order ${orderNumber} has been confirmed.`,
      data: { orderId, orderNumber, total },
    });

    // Send order confirmation email
    await JobScheduler.scheduleEmail({
      to: 'customer@example.com', // TODO: Get customer email
      subject: `Order Confirmation - ${orderNumber}`,
      template: 'order-confirmation',
      data: { orderId, orderNumber, total },
    });
  });

  // Order paid event
  eventBus.registerHandler('order.paid', async (payload: EventPayload) => {
    const { orderId, customerId, orderNumber, amount, transactionId } = payload.data;

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
    const { orderId, customerId, orderNumber, trackingNumber, carrier } = payload.data;

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
    const { orderId, customerId, orderNumber } = payload.data;

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
    const { orderId, customerId, orderNumber, reason } = payload.data;

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
    const { orderId, customerId, orderNumber, amount, reason } = payload.data;

    // Send refund notification
    await JobScheduler.scheduleNotification({
      userId: customerId,
      type: 'refund_processed',
      title: 'Refund Processed',
      message: `A refund of $${amount} has been processed for order ${orderNumber}.`,
      data: { orderId, orderNumber, amount, reason },
    });
  });
};

// Event handlers for payment events
export const registerPaymentEventHandlers = () => {
  eventBus.registerHandler('payment.received', async (payload: EventPayload) => {
    const { orderId, amount, transactionId } = payload.data;

    // Emit order paid event
    await eventBus.emit('order.paid', {
      orderId,
      amount,
      transactionId,
    });
  });

  eventBus.registerHandler('payment.failed', async (payload: EventPayload) => {
    const { orderId, customerId, amount, reason } = payload.data;

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
    const { productId, sku, currentStock, reorderPoint } = payload.data;

    console.log(`Low inventory alert: ${sku} (${currentStock} remaining, reorder at ${reorderPoint})`);

    // Send low stock notification to merchants
    await JobScheduler.scheduleNotification({
      userId: 'merchant', // TODO: Send to specific merchants
      type: 'low_stock_alert',
      title: 'Low Stock Alert',
      message: `Product ${sku} is running low on stock.`,
      data: { productId, sku, currentStock, reorderPoint },
    });
  });

  eventBus.registerHandler('inventory.out_of_stock', async (payload: EventPayload) => {
    const { productId, sku } = payload.data;

    // Send out of stock notification
    await JobScheduler.scheduleNotification({
      userId: 'merchant',
      type: 'out_of_stock_alert',
      title: 'Out of Stock Alert',
      message: `Product ${sku} is now out of stock.`,
      data: { productId, sku },
    });
  });

  eventBus.registerHandler('inventory.reserved', async (payload: EventPayload) => {
    const { productId, quantity, orderId, cartId } = payload.data;
  });

  eventBus.registerHandler('inventory.released', async (payload: EventPayload) => {
    const { productId, quantity, reason } = payload.data;

    console.log(`Inventory released: ${quantity} units of ${productId} (${reason})`);
  });
};

// Event handlers for customer events
export const registerCustomerEventHandlers = () => {
  eventBus.registerHandler('customer.registered', async (payload: EventPayload) => {
    const { customerId, email, firstName, lastName } = payload.data;

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
    const { customerId, changes } = payload.data;

    // Invalidate customer cache if needed
    // TODO: Implement customer caching
  });
};

// Event handlers for supplier events
export const registerSupplierEventHandlers = () => {
  eventBus.registerHandler('supplier.created', async (payload: EventPayload) => {
    const { supplierId, name, email } = payload.data;

    // Send supplier welcome email
    await JobScheduler.scheduleEmail({
      to: email,
      subject: 'Welcome to CommerceFull Supplier Network',
      template: 'supplier-welcome',
      data: { supplierId, name },
    });
  });

  eventBus.registerHandler('supplier.approved', async (payload: EventPayload) => {
    const { supplierId, name, email } = payload.data;

    // Send approval notification
    await JobScheduler.scheduleEmail({
      to: email,
      subject: 'Supplier Account Approved',
      template: 'supplier-approved',
      data: { supplierId, name },
    });
  });

  eventBus.registerHandler('purchase_order.created', async (payload: EventPayload) => {
    const { purchaseOrderId, supplierId, poNumber, supplierEmail } = payload.data;

    // Send PO to supplier
    await JobScheduler.scheduleEmail({
      to: supplierEmail,
      subject: `Purchase Order ${poNumber}`,
      template: 'purchase-order',
      data: { purchaseOrderId, poNumber },
    });
  });

  eventBus.registerHandler('purchase_order.approved', async (payload: EventPayload) => {
    const { purchaseOrderId, poNumber, supplierEmail } = payload.data;

    // Notify supplier of approval
    await JobScheduler.scheduleEmail({
      to: supplierEmail,
      subject: `Purchase Order ${poNumber} Approved`,
      template: 'po-approved',
      data: { purchaseOrderId, poNumber },
    });
  });

  eventBus.registerHandler('receiving.completed', async (payload: EventPayload) => {
    const { receivingRecordId, purchaseOrderId, receiptNumber } = payload.data;

    // Update inventory and send notifications
    // TODO: Trigger inventory updates
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
