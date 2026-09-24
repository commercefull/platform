/**
 * GetOrderDetails Use Case
 * Aggregates order with shipping, tax, discount, and payment sub-records
 *
 * Validates: Requirements 2.11
 */

import { OrderRepository } from '../../domain/repositories/OrderRepository';
import {
  OrderQueryRepository,
  OrderShipping,
  OrderShippingRate,
  OrderTax,
  OrderDiscount,
  OrderPayment,
  OrderPaymentRefund,
} from '../../domain/repositories/OrderQueryRepository';


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
  subtotalCents: number;
  discountTotalCents: number;
  taxTotalCents: number;
  shippingTotalCents: number;
  totalAmountCents: number;
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
    private readonly orders: OrderRepository,
    private readonly queryRepo: OrderQueryRepository,
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
      subtotalCents: order.subtotal.cents,
      discountTotalCents: order.discountTotal.cents,
      taxTotalCents: order.taxTotal.cents,
      shippingTotalCents: order.shippingTotal.cents,
      totalAmountCents: order.totalAmount.cents,
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
