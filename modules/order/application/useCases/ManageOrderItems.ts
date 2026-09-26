import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderItem } from '../../domain/entities/OrderItem';
import { Money } from '../../domain/valueObjects/Money';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import { generateUUID } from '../../../../libs/uuid';

export interface CreateOrderItemInput {
  orderId: string;
  productId: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  discountedUnitPriceCents?: number;
  lineTotalCents?: number;
  discountTotalCents?: number;
  taxTotalCents?: number;
  taxRate?: number;
  taxExempt?: boolean;
  fulfillmentStatus?: string;
  giftWrapped?: boolean;
  isDigital?: boolean;
  description?: string;
  variantId?: string;
}

export interface UpdateOrderItemInput {
  quantity?: number;
}

type OrderItemPort = Pick<OrderRepository, 'getOrderItems' | 'findOrderItemById' | 'addOrderItem' | 'updateOrderItem' | 'removeOrderItem'>;

export class ManageOrderItemsUseCase {
  constructor(private readonly orderRepo: OrderItemPort) {}

  async listItems(orderId: string): Promise<OrderItem[]> {
    return this.orderRepo.getOrderItems(orderId);
  }

  async getItem(orderItemId: string): Promise<OrderItem | null> {
    return this.orderRepo.findOrderItemById(orderItemId);
  }

  async addItem(input: CreateOrderItemInput): Promise<OrderItem> {
    const currency = 'USD';
    const item = OrderItem.reconstitute({
      orderItemId: generateUUID(),
      orderId: input.orderId,
      productId: input.productId,
      productVariantId: input.variantId,
      name: input.name,
      sku: input.sku || '',
      quantity: input.quantity,
      unitPrice: Money.fromCents(input.unitPriceCents, currency),
      discountedUnitPrice: Money.fromCents(input.discountedUnitPriceCents ?? input.unitPriceCents, currency),
      lineTotal: Money.fromCents(input.lineTotalCents ?? input.unitPriceCents * input.quantity, currency),
      discountTotal: Money.fromCents(input.discountTotalCents ?? 0, currency),
      taxTotal: Money.fromCents(input.taxTotalCents ?? 0, currency),
      taxRate: input.taxRate ?? 0,
      taxExempt: input.taxExempt ?? false,
      fulfillmentStatus: (input.fulfillmentStatus as FulfillmentStatus) ?? FulfillmentStatus.UNFULFILLED,
      giftWrapped: input.giftWrapped ?? false,
      isDigital: input.isDigital ?? false,
      description: input.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.orderRepo.addOrderItem(input.orderId, item);
    return item;
  }

  async updateItem(orderItemId: string, input: UpdateOrderItemInput): Promise<OrderItem | null> {
    const item = await this.orderRepo.findOrderItemById(orderItemId);
    if (!item) return null;

    if (input.quantity !== undefined) {
      item.updateQuantity(input.quantity);
    }

    await this.orderRepo.updateOrderItem(item);
    return item;
  }

  async removeItem(orderItemId: string): Promise<void> {
    await this.orderRepo.removeOrderItem(orderItemId);
  }
}
