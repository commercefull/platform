/**
 * Create Order Use Case
 * Creates a new order from checkout session
 */

import { generateUUID } from '../../../../libs/uuid';
import { withTransaction } from '../../../../libs/db';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { Order } from '../../domain/entities/Order';
import { OrderItem } from '../../domain/entities/OrderItem';
import { OrderAddress } from '../../domain/entities/OrderAddress';
import { Money } from '../../domain/valueObjects/Money';
import { eventBus } from '../../../../libs/events/eventBus';
import { OrderMustContainItemsError, CustomerEmailRequiredError, ShippingAddressRequiredError } from '../../domain/errors/OrderErrors';

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
  /** Unit price in integer cents. */
  unitPriceCents: number;
  /** Discounted unit price in integer cents. */
  discountedUnitPriceCents?: number;
  /** Tax rate percentage. */
  taxRate?: number;
  options?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
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
    public readonly storeId?: string,
    public readonly channelId?: string,
    public readonly createdByUserId?: string,
    public readonly orderSource?: string,
    public readonly currencyCode?: string,
    public readonly customerPhone?: string,
    public readonly customerName?: string,
    public readonly customerNotes?: string,
    /** Shipping total in integer cents. */
    public readonly shippingTotalCents?: number,
    public readonly hasGiftWrapping?: boolean,
    public readonly giftMessage?: string,
    public readonly isGift?: boolean,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly referralSource?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  storeId?: string;
  channelId?: string;
  createdByUserId?: string;
  orderSource: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotalCents: number;
  discountTotalCents: number;
  taxTotalCents: number;
  shippingTotalCents: number;
  totalAmountCents: number;
  totalItems: number;
  totalQuantity: number;
  currencyCode: string;
  customerEmail: string;
  createdAt: string;
  items?: Array<Record<string, unknown>>;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: CreateOrderCommand): Promise<OrderResponse> {
    // Validate command
    if (!command.items || command.items.length === 0) {
      throw new OrderMustContainItemsError();
    }

    if (!command.customerEmail) {
      throw new CustomerEmailRequiredError();
    }

    if (!command.shippingAddress) {
      throw new ShippingAddressRequiredError();
    }

    const orderId = generateUUID();
    const currency = command.currencyCode || 'USD';

    // Create order
    const order = Order.create({
      orderId,
      customerId: command.customerId,
      basketId: command.basketId,
      storeId: command.storeId,
      channelId: command.channelId,
      createdByUserId: command.createdByUserId,
      orderSource: command.orderSource,
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
        unitPrice: Money.fromCents(itemInput.unitPriceCents, currency),
        discountedUnitPrice: itemInput.discountedUnitPriceCents != null ? Money.fromCents(itemInput.discountedUnitPriceCents, currency) : undefined,
        taxRate: itemInput.taxRate,
        options: itemInput.options,
        attributes: itemInput.attributes,
        isDigital: itemInput.isDigital,
      });
      order.addItem(item);
    }

    // Set shipping total
    if (command.shippingTotalCents) {
      order.setShippingTotal(Money.fromCents(command.shippingTotalCents, currency));
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

    // Save order and record initial status history in a single transaction
    const savedOrder = await withTransaction(async () => {
      const saved = await this.orderRepository.save(order);

      await this.orderRepository.recordStatusChange(saved.orderId, saved.status, 'Initial status', 'pending');
      await this.orderRepository.recordPaymentStatusChange(saved.orderId, saved.paymentStatus);
      await this.orderRepository.recordFulfillmentStatusChange(saved.orderId, saved.fulfillmentStatus);

      return saved;
    });

    // Emit event
    eventBus.emit('order.created', {
      orderId: savedOrder.orderId,
      orderNumber: savedOrder.orderNumber,
      customerId: savedOrder.customerId,
      totalAmountCents: savedOrder.totalAmount.cents,
      discountTotalCents: savedOrder.discountTotal.cents,
      taxTotalCents: savedOrder.taxTotal.cents,
      shippingTotalCents: savedOrder.shippingTotal.cents,
      itemCount: savedOrder.totalQuantity,
      currency: savedOrder.currencyCode,
      items: savedOrder.items.map(i => ({
        productId: i.productId,
        productVariantId: i.productVariantId,
        quantity: i.quantity,
        unitPriceCents: i.unitPrice.cents,
        lineTotalCents: i.lineTotal.cents,
      })),
    });

    return this.mapToResponse(savedOrder);
  }

  private mapToResponse(order: Order): OrderResponse {
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      storeId: order.storeId,
      channelId: order.channelId,
      createdByUserId: order.createdByUserId,
      orderSource: order.orderSource,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      subtotalCents: order.subtotal.cents,
      discountTotalCents: order.discountTotal.cents,
      taxTotalCents: order.taxTotal.cents,
      shippingTotalCents: order.shippingTotal.cents,
      totalAmountCents: order.totalAmount.cents,
      totalItems: order.totalItems,
      totalQuantity: order.totalQuantity,
      currencyCode: order.currencyCode,
      customerEmail: order.customerEmail,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(i => i.toJSON()),
    };
  }
}
