/**
 * List Orders Use Case
 * Lists orders with filters and pagination (for admin/business use)
 */

import { OrderRepository, OrderFilters, PaginationOptions } from '../../domain/repositories/OrderRepository';
import { Order } from '../../domain/entities/Order';
import { OrderStatus } from '../../domain/valueObjects/OrderStatus';
import { PaymentStatus } from '../../domain/valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';

// ============================================================================
// Command
// ============================================================================

export class ListOrdersCommand {
  constructor(
    public readonly filters?: {
      customerId?: string;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      fulfillmentStatus?: FulfillmentStatus;
      startDate?: Date;
      endDate?: Date;
      minAmount?: number;
      maxAmount?: number;
      tags?: string[];
      search?: string;
    },
    public readonly limit: number = 50,
    public readonly offset: number = 0,
    public readonly orderBy: string = 'createdAt',
    public readonly orderDirection: 'asc' | 'desc' = 'desc',
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface OrderListItemResponse {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerEmail: string;
  customerName?: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalAmount: number;
  totalItems: number;
  currencyCode: string;
  orderDate: string;
  createdAt: string;
  tags: string[];
}

export interface ListOrdersResponse {
  orders: OrderListItemResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// Use Case
// ============================================================================

export class ListOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: ListOrdersCommand): Promise<ListOrdersResponse> {
    const filters: OrderFilters = command.filters || {};

    const pagination: PaginationOptions = {
      limit: command.limit,
      offset: command.offset,
      orderBy: command.orderBy,
      orderDirection: command.orderDirection,
    };

    const result = await this.orderRepository.findAll(filters, pagination);

    return {
      orders: result.data.map(order => this.mapToListItem(order)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }

  private mapToListItem(order: Order): OrderListItemResponse {
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      totalAmount: order.totalAmount.amount,
      totalItems: order.totalItems,
      currencyCode: order.currencyCode,
      orderDate: order.orderDate.toISOString(),
      createdAt: order.createdAt.toISOString(),
      tags: order.tags,
    };
  }
}
