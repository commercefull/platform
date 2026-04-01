/**
 * GetOrderDetails Use Case
 * Aggregates order with shipping, tax, discount, and payment sub-records
 *
 * Validates: Requirements 2.11
 */

import orderRepo from '../../infrastructure/repositories/orderRepo';
import orderShippingRepo, { OrderShipping } from '../../infrastructure/repositories/orderShippingRepo';
import orderShippingRateRepo, { OrderShippingRate } from '../../infrastructure/repositories/orderShippingRateRepo';
import orderTaxRepo, { OrderTax } from '../../infrastructure/repositories/orderTaxRepo';
import orderDiscountRepo, { OrderDiscount } from '../../infrastructure/repositories/orderDiscountRepo';
import orderPaymentRepo, { OrderPayment } from '../../infrastructure/repositories/orderPaymentRepo';
import orderPaymentRefundRepo, { OrderPaymentRefund } from '../../infrastructure/repositories/orderPaymentRefundRepo';

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
    private readonly orders: typeof orderRepo = orderRepo,
    private readonly shippingRepo: typeof orderShippingRepo = orderShippingRepo,
    private readonly shippingRateRepo: typeof orderShippingRateRepo = orderShippingRateRepo,
    private readonly taxRepo: typeof orderTaxRepo = orderTaxRepo,
    private readonly discountRepo: typeof orderDiscountRepo = orderDiscountRepo,
    private readonly paymentRepo: typeof orderPaymentRepo = orderPaymentRepo,
    private readonly refundRepo: typeof orderPaymentRefundRepo = orderPaymentRefundRepo,
  ) {}

  async execute(command: GetOrderDetailsCommand): Promise<OrderDetailsResponse | null> {
    const order = await this.orders.findById(command.orderId);
    if (!order) return null;

    const [shipping, shippingRates, taxes, discounts, payments, refunds] = await Promise.all([
      this.shippingRepo.findByOrder(command.orderId),
      this.shippingRateRepo.findByOrder(command.orderId),
      this.taxRepo.findByOrder(command.orderId),
      this.discountRepo.findByOrder(command.orderId),
      this.paymentRepo.findByOrder(command.orderId),
      this.refundRepo.findByOrder(command.orderId),
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
