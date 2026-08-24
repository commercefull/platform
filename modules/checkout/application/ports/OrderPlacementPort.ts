/**
 * OrderPlacementPort
 *
 * ACL port owned by checkout. Creates, finds, updates, and cancels orders
 * through checkout's vocabulary — no OrderStatus/PaymentStatus types leak.
 *
 * Checkout holds its own CheckoutOutcome enum; the adapter maps it
 * to order's internal status values.
 */

export interface OrderAddressInput {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phone?: string;
}

export interface OrderItemInput {
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderRequest {
  customerId?: string;
  customerEmail: string;
  items: OrderItemInput[];
  shippingAddress: OrderAddressInput;
  billingAddress: OrderAddressInput;
  basketId: string;
  source: string;
  currency: string;
  notes?: string;
  shippingAmount: number;
  metadata?: Record<string, unknown>;
}

export interface OrderSnapshot {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
}

export type CheckoutOutcome = 'pending_payment' | 'processing' | 'cancelled' | 'completed';

export interface OrderPlacementPort {
  createOrder(request: CreateOrderRequest): Promise<OrderSnapshot>;
  findOrder(orderId: string): Promise<OrderSnapshot | null>;
  updateOrderStatus(orderId: string, outcome: CheckoutOutcome): Promise<void>;
  cancelOrder(orderId: string, reason: string): Promise<void>;
}
