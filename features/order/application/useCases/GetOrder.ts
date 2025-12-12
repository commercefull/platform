/**
 * Get Order Use Case
 * Retrieves order details by ID or order number
 */

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { Order } from '../../domain/entities/Order';

// ============================================================================
// Command
// ============================================================================

export class GetOrderCommand {
  constructor(
    public readonly orderId?: string,
    public readonly orderNumber?: string,
    public readonly customerId?: string // For authorization check
  ) {
    if (!orderId && !orderNumber) {
      throw new Error('Either orderId or orderNumber must be provided');
    }
  }
}

// ============================================================================
// Response
// ============================================================================

export interface OrderItemResponse {
  orderItemId: string;
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountedUnitPrice?: number;
  lineTotal: number;
  discountTotal: number;
  taxTotal: number;
  fulfillmentStatus: string;
  giftWrapped: boolean;
  giftMessage?: string;
  isDigital: boolean;
}

export interface OrderAddressResponse {
  orderAddressId: string;
  addressType: string;
  firstName: string;
  lastName: string;
  fullName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phone?: string;
  email?: string;
  fullAddress: string;
}

export interface OrderDetailResponse {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  basketId?: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currencyCode: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  handlingFee: number;
  totalAmount: number;
  totalItems: number;
  totalQuantity: number;
  taxExempt: boolean;
  orderDate: string;
  completedAt?: string;
  cancelledAt?: string;
  returnedAt?: string;
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  customerNotes?: string;
  estimatedDeliveryDate?: string;
  hasGiftWrapping: boolean;
  giftMessage?: string;
  isGift: boolean;
  isSubscriptionOrder: boolean;
  items: OrderItemResponse[];
  shippingAddress?: OrderAddressResponse;
  billingAddress?: OrderAddressResponse;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class GetOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: GetOrderCommand): Promise<OrderDetailResponse | null> {
    let order: Order | null = null;

    if (command.orderId) {
      order = await this.orderRepository.findById(command.orderId);
    } else if (command.orderNumber) {
      order = await this.orderRepository.findByOrderNumber(command.orderNumber);
    }

    if (!order) {
      return null;
    }

    // Authorization check - if customerId is provided, ensure order belongs to customer
    if (command.customerId && order.customerId !== command.customerId) {
      throw new Error('You do not have permission to view this order');
    }

    return this.mapToResponse(order);
  }

  private mapToResponse(order: Order): OrderDetailResponse {
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      basketId: order.basketId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      currencyCode: order.currencyCode,
      subtotal: order.subtotal.amount,
      discountTotal: order.discountTotal.amount,
      taxTotal: order.taxTotal.amount,
      shippingTotal: order.shippingTotal.amount,
      handlingFee: order.handlingFee.amount,
      totalAmount: order.totalAmount.amount,
      totalItems: order.totalItems,
      totalQuantity: order.totalQuantity,
      taxExempt: order.taxExempt,
      orderDate: order.orderDate.toISOString(),
      completedAt: order.completedAt?.toISOString(),
      cancelledAt: order.cancelledAt?.toISOString(),
      returnedAt: order.returnedAt?.toISOString(),
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      customerNotes: order.customerNotes,
      estimatedDeliveryDate: order.estimatedDeliveryDate?.toISOString(),
      hasGiftWrapping: order.hasGiftWrapping,
      giftMessage: order.giftMessage,
      isGift: order.isGift,
      isSubscriptionOrder: order.isSubscriptionOrder,
      items: order.items.map(item => ({
        orderItemId: item.orderItemId,
        productId: item.productId,
        productVariantId: item.productVariantId,
        sku: item.sku,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        discountedUnitPrice: item.discountedUnitPrice?.amount,
        lineTotal: item.lineTotal.amount,
        discountTotal: item.discountTotal.amount,
        taxTotal: item.taxTotal.amount,
        fulfillmentStatus: item.fulfillmentStatus,
        giftWrapped: item.giftWrapped,
        giftMessage: item.giftMessage,
        isDigital: item.isDigital
      })),
      shippingAddress: order.shippingAddress ? {
        orderAddressId: order.shippingAddress.orderAddressId,
        addressType: order.shippingAddress.addressType,
        firstName: order.shippingAddress.firstName,
        lastName: order.shippingAddress.lastName,
        fullName: order.shippingAddress.fullName,
        company: order.shippingAddress.company,
        address1: order.shippingAddress.address1,
        address2: order.shippingAddress.address2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        countryCode: order.shippingAddress.countryCode,
        phone: order.shippingAddress.phone,
        email: order.shippingAddress.email,
        fullAddress: order.shippingAddress.fullAddress
      } : undefined,
      billingAddress: order.billingAddress ? {
        orderAddressId: order.billingAddress.orderAddressId,
        addressType: order.billingAddress.addressType,
        firstName: order.billingAddress.firstName,
        lastName: order.billingAddress.lastName,
        fullName: order.billingAddress.fullName,
        company: order.billingAddress.company,
        address1: order.billingAddress.address1,
        address2: order.billingAddress.address2,
        city: order.billingAddress.city,
        state: order.billingAddress.state,
        postalCode: order.billingAddress.postalCode,
        country: order.billingAddress.country,
        countryCode: order.billingAddress.countryCode,
        phone: order.billingAddress.phone,
        email: order.billingAddress.email,
        fullAddress: order.billingAddress.fullAddress
      } : undefined,
      tags: order.tags,
      metadata: order.metadata,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    };
  }
}
