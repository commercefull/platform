/**
 * Order Repository Interface
 * Defines the contract for order persistence operations
 */

import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { OrderAddress } from '../entities/OrderAddress';
import { OrderStatus } from '../valueObjects/OrderStatus';
import { PaymentStatus } from '../valueObjects/PaymentStatus';
import { FulfillmentStatus } from '../valueObjects/FulfillmentStatus';

export interface OrderFilters {
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
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface OrderRepository {
  /**
   * Find order by ID
   */
  findById(orderId: string): Promise<Order | null>;

  /**
   * Find order by order number
   */
  findByOrderNumber(orderNumber: string): Promise<Order | null>;

  /**
   * Find orders by customer ID
   */
  findByCustomerId(customerId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Order>>;

  /**
   * Find all orders with filters and pagination
   */
  findAll(filters?: OrderFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Order>>;

  /**
   * Find orders by status
   */
  findByStatus(status: OrderStatus, pagination?: PaginationOptions): Promise<PaginatedResult<Order>>;

  /**
   * Find orders by payment status
   */
  findByPaymentStatus(paymentStatus: PaymentStatus, pagination?: PaginationOptions): Promise<PaginatedResult<Order>>;

  /**
   * Find orders by fulfillment status
   */
  findByFulfillmentStatus(fulfillmentStatus: FulfillmentStatus, pagination?: PaginationOptions): Promise<PaginatedResult<Order>>;

  /**
   * Find orders in a date range
   */
  findByDateRange(startDate: Date, endDate: Date, pagination?: PaginationOptions): Promise<PaginatedResult<Order>>;

  /**
   * Save order (create or update)
   */
  save(order: Order): Promise<Order>;

  /**
   * Delete order (soft delete)
   */
  delete(orderId: string): Promise<void>;

  /**
   * Count total orders
   */
  count(filters?: OrderFilters): Promise<number>;

  /**
   * Count orders by customer
   */
  countByCustomer(customerId: string): Promise<number>;

  /**
   * Count orders by status
   */
  countByStatus(status: OrderStatus): Promise<number>;

  // Order Items
  /**
   * Get items for an order
   */
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  /**
   * Add item to order
   */
  addOrderItem(orderId: string, item: OrderItem): Promise<OrderItem>;

  /**
   * Update order item
   */
  updateOrderItem(item: OrderItem): Promise<OrderItem>;

  /**
   * Remove item from order
   */
  removeOrderItem(orderItemId: string): Promise<void>;

  // Order Addresses
  /**
   * Get addresses for an order
   */
  getOrderAddresses(orderId: string): Promise<OrderAddress[]>;

  /**
   * Add or update order address
   */
  saveOrderAddress(address: OrderAddress): Promise<OrderAddress>;

  /**
   * Get shipping address for an order
   */
  getShippingAddress(orderId: string): Promise<OrderAddress | null>;

  /**
   * Get billing address for an order
   */
  getBillingAddress(orderId: string): Promise<OrderAddress | null>;

  // Order Status History
  /**
   * Record status change in history
   */
  recordStatusChange(orderId: string, status: OrderStatus, reason?: string): Promise<void>;

  /**
   * Record payment status change in history
   */
  recordPaymentStatusChange(orderId: string, status: PaymentStatus, transactionId?: string): Promise<void>;

  /**
   * Record fulfillment status change in history
   */
  recordFulfillmentStatusChange(orderId: string, status: FulfillmentStatus): Promise<void>;

  /**
   * Get order status history
   */
  getStatusHistory(orderId: string): Promise<Array<{ status: OrderStatus; reason?: string; createdAt: Date }>>;

  // Analytics
  /**
   * Get order statistics
   */
  getOrderStats(filters?: OrderFilters): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<OrderStatus, number>;
  }>;
}
