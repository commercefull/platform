/**
 * GetOrderDetails Use Case
 * Aggregates order with shipping, tax, discount, and payment sub-records
 *
 * Validates: Requirements 2.11
 */

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderQueryRepository, OrderShipping, OrderShippingRate, OrderTax, OrderDiscount, OrderPayment, OrderPaymentRefund } from '../../domain/repositories/OrderQueryRepository';
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';

const orderRepo = orderDataRepository.commands;
const orderQueryRepo = orderDataRepository.queries;

// ============================================================================
// Command
// ============================================================================

export class GetOrderDetailsCommand {
  constructor(public readonly orderId: string) {}
}

// ============================================================================
// Response
// ============================================================================

export interface OrderDetailsResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currencyCode: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  totalAmount: number;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
  shipping: OrderShipping[];
  shippingRates: OrderShippingRate[];
  taxes: OrderTax[];
  discounts: OrderDiscount[];
  payments: OrderPayment[];
  refunds: OrderPaymentRefund[];
}

// ============================================================================
// Use Case
// ============================================================================

export class GetOrderDetailsUseCase {
  constructor(
    private readonly orders: OrderRepository = orderRepo,
    private readonly queryRepo: OrderQueryRepository = orderQueryRepo,
  ) {}

  async execute(command: GetOrderDetailsCommand): Promise<OrderDetailsResponse | null> {
    const order = await this.orders.findById(command.orderId);
    if (!order) return null;

    const [shipping, shippingRates, taxes, discounts, payments, refunds] = await Promise.all([
      this.queryRepo.findShippingByOrder(command.orderId),
      this.queryRepo.findShippingRatesByOrder(command.orderId),
      this.queryRepo.findTaxesByOrder(command.orderId),
      this.queryRepo.findDiscountsByOrder(command.orderId),
      this.queryRepo.findPaymentsByOrder(command.orderId),
      this.queryRepo.findRefundsByOrder(command.orderId),
    ]);

    return {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      currencyCode: order.currencyCode,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      taxTotal: Number(order.taxTotal),
      shippingTotal: Number(order.shippingTotal),
      totalAmount: Number(order.totalAmount),
      customerEmail: order.customerEmail,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
      updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : String(order.updatedAt),
      shipping,
      shippingRates,
      taxes,
      discounts,
      payments,
      refunds,
    };
  }
}
