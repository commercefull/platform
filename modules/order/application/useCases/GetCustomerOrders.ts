/**
 * Get Customer Orders Use Case
 * Retrieves orders for a specific customer with pagination
 */

import { OrderRepository, PaginationOptions } from '../../domain/repositories/OrderRepository';
import { Order } from '../../domain/entities/Order';

// ============================================================================
// Command
// ============================================================================

export class GetCustomerOrdersCommand {
  constructor(
    public readonly customerId: string,
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly orderBy: string = 'createdAt',
    public readonly orderDirection: 'asc' | 'desc' = 'desc'
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface OrderSummaryResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalAmount: number;
  totalItems: number;
  currencyCode: string;
  orderDate: string;
  createdAt: string;
}

export interface CustomerOrdersResponse {
  orders: OrderSummaryResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// Use Case
// ============================================================================

export class GetCustomerOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(command: GetCustomerOrdersCommand): Promise<CustomerOrdersResponse> {
    if (!command.customerId) {
      throw new Error('Customer ID is required');
    }

    const pagination: PaginationOptions = {
      limit: command.limit,
      offset: command.offset,
      orderBy: command.orderBy,
      orderDirection: command.orderDirection
    };

    const result = await this.orderRepository.findByCustomerId(command.customerId, pagination);

    return {
      orders: result.data.map(order => this.mapToSummary(order)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore
    };
  }

  private mapToSummary(order: Order): OrderSummaryResponse {
    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      totalAmount: order.totalAmount.amount,
      totalItems: order.totalItems,
      currencyCode: order.currencyCode,
      orderDate: order.orderDate.toISOString(),
      createdAt: order.createdAt.toISOString()
    };
  }
}
