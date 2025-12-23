/**
 * Create Order Use Case
 * Creates a new order from checkout session
 */

import { generateUUID } from '../../../../libs/uuid';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { Order } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/entities/OrderItem';
import { OrderAddress } from '../../domain/entities/OrderAddress';
import { Money } from '../../domain/valueObjects/Money';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export interface OrderItemInput {
  productId: string;
  productVariantId?: string;
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountedUnitPrice?: number;
  taxRate?: number;
  options?: Record<string, any>;
  attributes?: Record<string, any>;
  isDigital?: boolean;
}

export interface AddressInput {
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
  email?: string;
}

export class CreateOrderCommand {
  constructor(
    public readonly customerId: string | undefined,
    public readonly customerEmail: string,
    public readonly items: OrderItemInput[],
    public readonly shippingAddress: AddressInput,
    public readonly billingAddress?: AddressInput,
    public readonly basketId?: string,
    public readonly currencyCode?: string,
    public readonly customerPhone?: string,
    public readonly customerName?: string,
    public readonly customerNotes?: string,
    public readonly shippingTotal?: number,
    public readonly hasGiftWrapping?: boolean,
    public readonly giftMessage?: string,
    public readonly isGift?: boolean,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly referralSource?: string,
    public readonly metadata?: Record<string, any>,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  totalAmount: number;
  totalItems: number;
  totalQuantity: number;
  currencyCode: string;
  customerEmail: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: CreateOrderCommand): Promise<OrderResponse> {
    // Validate command
    if (!command.items || command.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    if (!command.customerEmail) {
      throw new Error('Customer email is required');
    }

    if (!command.shippingAddress) {
      throw new Error('Shipping address is required');
    }

    const orderId = generateUUID();
    const currency = command.currencyCode || 'USD';

    // Create order
    const order = Order.create({
      orderId,
      customerId: command.customerId,
      basketId: command.basketId,
      currencyCode: currency,
      customerEmail: command.customerEmail,
      customerPhone: command.customerPhone,
      customerName: command.customerName,
      customerNotes: command.customerNotes,
      hasGiftWrapping: command.hasGiftWrapping,
      giftMessage: command.giftMessage,
      isGift: command.isGift,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      referralSource: command.referralSource,
      metadata: command.metadata,
    });

    // Add items
    for (const itemInput of command.items) {
      const item = OrderItem.create({
        orderItemId: generateUUID(),
        orderId,
        productId: itemInput.productId,
        productVariantId: itemInput.productVariantId,
        sku: itemInput.sku,
        name: itemInput.name,
        description: itemInput.description,
        quantity: itemInput.quantity,
        unitPrice: Money.create(itemInput.unitPrice, currency),
        discountedUnitPrice: itemInput.discountedUnitPrice ? Money.create(itemInput.discountedUnitPrice, currency) : undefined,
        taxRate: itemInput.taxRate,
        options: itemInput.options,
        attributes: itemInput.attributes,
        isDigital: itemInput.isDigital,
      });
      order.addItem(item);
    }

    // Set shipping total
    if (command.shippingTotal) {
      order.setShippingTotal(Money.create(command.shippingTotal, currency));
    }

    // Create shipping address
    const shippingAddress = OrderAddress.create({
      orderAddressId: generateUUID(),
      orderId,
      addressType: 'shipping',
      ...command.shippingAddress,
    });
    order.setShippingAddress(shippingAddress);

    // Create billing address (use shipping if not provided)
    const billingAddressInput = command.billingAddress || command.shippingAddress;
    const billingAddress = OrderAddress.create({
      orderAddressId: generateUUID(),
      orderId,
      addressType: 'billing',
      ...billingAddressInput,
    });
    order.setBillingAddress(billingAddress);

    // Save order
    const savedOrder = await this.orderRepository.save(order);

    // Emit event
    eventBus.emit('order.created', {
      orderId: savedOrder.orderId,
      orderNumber: savedOrder.orderNumber,
      customerId: savedOrder.customerId,
      totalAmount: savedOrder.totalAmount.amount,
      currency: savedOrder.currencyCode,
    });

    return this.mapToResponse(savedOrder);
  }

  private mapToResponse(order: Order): OrderResponse {
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      subtotal: order.subtotal.amount,
      discountTotal: order.discountTotal.amount,
      taxTotal: order.taxTotal.amount,
      shippingTotal: order.shippingTotal.amount,
      totalAmount: order.totalAmount.amount,
      totalItems: order.totalItems,
      totalQuantity: order.totalQuantity,
      currencyCode: order.currencyCode,
      customerEmail: order.customerEmail,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
