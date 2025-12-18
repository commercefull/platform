import { 
  BaseNotification, 
  NotificationBuilder, 
  NotificationChannel, 
  NotificationType 
} from './notification';

/**
 * Common parameters for all order-related notifications
 */
export interface OrderNotificationBaseParams {
  firstName: string;
  orderNumber: string;
  orderDate: string;
  orderTotal: string;
  orderItems: Array<{
    productName: string;
    quantity: number;
    price: string;
  }>;
  currency?: string;
}

/**
 * Order confirmation notification parameters
 */
export interface OrderConfirmationParams extends OrderNotificationBaseParams {
  estimatedDelivery?: string;
  paymentMethod: string;
  shippingAddress: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

/**
 * Order confirmation notification
 */
export class OrderConfirmationNotification extends NotificationBuilder<OrderConfirmationParams> {
  private params: OrderConfirmationParams;
  
  constructor(userId: string, params: OrderConfirmationParams, channels: NotificationChannel[] = ['email']) {
    super(userId, 'customer', channels);
    this.type = 'order_confirmation';
    this.params = params;
  }
  
  buildTitle(): string {
    return `Order Confirmation #${this.params.orderNumber}`;
  }
  
  buildContent(): string {
    let content = `Dear ${this.params.firstName},\n\n`;
    content += `Thank you for your order #${this.params.orderNumber}. We're pleased to confirm that we've received your order and it's being processed.\n\n`;
    
    content += 'Order Details:\n';
    content += `Date: ${this.params.orderDate}\n`;
    content += `Total: ${this.params.currency || '$'}${this.params.orderTotal}\n`;
    content += `Payment Method: ${this.params.paymentMethod}\n\n`;
    
    content += 'Items Ordered:\n';
    this.params.orderItems.forEach(item => {
      content += `- ${item.productName} (Qty: ${item.quantity}) - ${this.params.currency || '$'}${item.price}\n`;
    });
    
    content += '\nShipping Address:\n';
    const address = this.params.shippingAddress;
    content += `${address.streetAddress}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}\n\n`;
    
    if (this.params.estimatedDelivery) {
      content += `Estimated Delivery: ${this.params.estimatedDelivery}\n\n`;
    }
    
    content += 'If you have any questions about your order, please contact our customer service team.\n\n';
    content += 'Thank you for shopping with us!\n';
    content += 'The Team';
    
    return content;
  }
  
  getMetadata(): Record<string, unknown> {
    return {
      orderNumber: this.params.orderNumber,
      orderDate: this.params.orderDate,
      orderTotal: this.params.orderTotal,
      itemCount: this.params.orderItems.length,
      estimatedDelivery: this.params.estimatedDelivery,
      shippingAddressCity: this.params.shippingAddress.city,
      shippingAddressCountry: this.params.shippingAddress.country
    };
  }
}

/**
 * Order shipped notification parameters
 */
export interface OrderShippedParams extends OrderNotificationBaseParams {
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

/**
 * Order shipped notification
 */
export class OrderShippedNotification extends NotificationBuilder<OrderShippedParams> {
  private params: OrderShippedParams;
  
  constructor(userId: string, params: OrderShippedParams, channels: NotificationChannel[] = ['email', 'sms']) {
    super(userId, 'customer', channels);
    this.type = 'order_shipped';
    this.params = params;
  }
  
  buildTitle(): string {
    return `Your Order #${this.params.orderNumber} Has Shipped`;
  }
  
  buildContent(): string {
    let content = `Hello ${this.params.firstName},\n\n`;
    content += `Great news! Your order #${this.params.orderNumber} has been shipped.\n\n`;
    
    if (this.params.carrier) {
      content += `Carrier: ${this.params.carrier}\n`;
    }
    
    if (this.params.trackingNumber) {
      content += `Tracking Number: ${this.params.trackingNumber}\n`;
    }
    
    if (this.params.trackingUrl) {
      content += `Track your package here: ${this.params.trackingUrl}\n`;
    }
    
    if (this.params.estimatedDelivery) {
      content += `Estimated Delivery: ${this.params.estimatedDelivery}\n`;
    }
    
    content += '\nItems Shipped:\n';
    this.params.orderItems.forEach(item => {
      content += `- ${item.productName} (Qty: ${item.quantity})\n`;
    });
    
    content += '\nThank you for shopping with us!\n';
    content += 'The Team';
    
    return content;
  }
  
  getMetadata(): Record<string, unknown> {
    return {
      orderNumber: this.params.orderNumber,
      trackingNumber: this.params.trackingNumber,
      trackingUrl: this.params.trackingUrl,
      carrier: this.params.carrier,
      estimatedDelivery: this.params.estimatedDelivery
    };
  }
}

/**
 * Order delivered notification
 */
export class OrderDeliveredNotification extends NotificationBuilder<OrderNotificationBaseParams> {
  private params: OrderNotificationBaseParams;
  
  constructor(userId: string, params: OrderNotificationBaseParams, channels: NotificationChannel[] = ['email', 'push']) {
    super(userId, 'customer', channels);
    this.type = 'order_delivered';
    this.params = params;
  }
  
  buildTitle(): string {
    return `Your Order #${this.params.orderNumber} Has Been Delivered`;
  }
  
  buildContent(): string {
    let content = `Hello ${this.params.firstName},\n\n`;
    content += `Your order #${this.params.orderNumber} has been delivered. We hope you enjoy your purchase!\n\n`;
    
    content += 'Order Details:\n';
    content += `Date: ${this.params.orderDate}\n`;
    content += `Total: ${this.params.currency || '$'}${this.params.orderTotal}\n\n`;
    
    content += 'Items Received:\n';
    this.params.orderItems.forEach(item => {
      content += `- ${item.productName} (Qty: ${item.quantity})\n`;
    });
    
    content += '\nWe would love to hear your feedback about your purchase. Please consider leaving a review.\n\n';
    content += 'Thank you for shopping with us!\n';
    content += 'The Team';
    
    return content;
  }
  
  getMetadata(): Record<string, unknown> {
    return {
      orderNumber: this.params.orderNumber,
      orderDate: this.params.orderDate,
      orderTotal: this.params.orderTotal
    };
  }
}

/**
 * Order cancelled notification parameters
 */
export interface OrderCancelledParams extends OrderNotificationBaseParams {
  cancellationReason?: string;
  refundAmount?: string;
  refundMethod?: string;
  refundETA?: string;
}

/**
 * Order cancelled notification
 */
export class OrderCancelledNotification extends NotificationBuilder<OrderCancelledParams> {
  private params: OrderCancelledParams;
  
  constructor(userId: string, params: OrderCancelledParams, channels: NotificationChannel[] = ['email']) {
    super(userId, 'customer', channels);
    this.type = 'order_cancelled';
    this.params = params;
  }
  
  buildTitle(): string {
    return `Your Order #${this.params.orderNumber} Has Been Cancelled`;
  }
  
  buildContent(): string {
    let content = `Dear ${this.params.firstName},\n\n`;
    content += `We're writing to confirm that your order #${this.params.orderNumber} has been cancelled.\n\n`;
    
    if (this.params.cancellationReason) {
      content += `Reason for cancellation: ${this.params.cancellationReason}\n\n`;
    }
    
    content += 'Cancelled Items:\n';
    this.params.orderItems.forEach(item => {
      content += `- ${item.productName} (Qty: ${item.quantity}) - ${this.params.currency || '$'}${item.price}\n`;
    });
    
    if (this.params.refundAmount) {
      content += `\nRefund Amount: ${this.params.currency || '$'}${this.params.refundAmount}\n`;
      
      if (this.params.refundMethod) {
        content += `Refund Method: ${this.params.refundMethod}\n`;
      }
      
      if (this.params.refundETA) {
        content += `Estimated Time for Refund: ${this.params.refundETA}\n`;
      }
    }
    
    content += '\nIf you have any questions or concerns, please contact our customer service team.\n\n';
    content += 'We appreciate your understanding.\n';
    content += 'The Team';
    
    return content;
  }
  
  getMetadata(): Record<string, unknown> {
    return {
      orderNumber: this.params.orderNumber,
      orderDate: this.params.orderDate,
      orderTotal: this.params.orderTotal,
      cancellationReason: this.params.cancellationReason,
      refundAmount: this.params.refundAmount,
      refundMethod: this.params.refundMethod
    };
  }
}
