/**
 * Consolidated Order Query Repository Port
 *
 * Merges OrderNote, OrderDiscount, OrderShipping, OrderShippingRate,
 * OrderTax, OrderPayment, and OrderPaymentRefund sub-ports into a single
 * aggregate-aligned port.
 */

import type { OrderNote, OrderNoteCreateParams } from './OrderNoteRepository';
import type { OrderDiscount, OrderDiscountCreateParams } from './OrderDiscountRepository';
import type { OrderShipping, OrderShippingCreateParams, OrderShippingUpdateParams } from './OrderShippingRepository';
import type { OrderShippingRate, OrderShippingRateCreateParams } from './OrderShippingRateRepository';
import type { OrderTax, OrderTaxCreateParams } from './OrderTaxRepository';
import type { OrderPayment, OrderPaymentCreateParams } from './OrderPaymentRepository';
import type { OrderPaymentRefund, OrderPaymentRefundCreateParams } from './OrderPaymentRefundRepository';

// Re-export types for backward compatibility
export type { OrderNote, OrderNoteCreateParams } from './OrderNoteRepository';
export type { OrderDiscount, OrderDiscountCreateParams, DiscountType } from './OrderDiscountRepository';
export type { OrderShipping, OrderShippingCreateParams, OrderShippingUpdateParams } from './OrderShippingRepository';
export type { OrderShippingRate, OrderShippingRateCreateParams, ShippingCarrier } from './OrderShippingRateRepository';
export type { OrderTax, OrderTaxCreateParams } from './OrderTaxRepository';
export type { OrderPayment, OrderPaymentCreateParams, OrderPaymentType, OrderPaymentStatus } from './OrderPaymentRepository';
export type { OrderPaymentRefund, OrderPaymentRefundCreateParams, OrderPaymentRefundStatus } from './OrderPaymentRefundRepository';

export interface OrderQueryRepository {
  // Notes
  findNotesByOrder(orderId: string): Promise<OrderNote[]>;
  createNote(params: OrderNoteCreateParams): Promise<OrderNote>;
  softDeleteNote(orderNoteId: string): Promise<boolean>;

  // Discounts
  findDiscountsByOrder(orderId: string): Promise<OrderDiscount[]>;
  createDiscount(params: OrderDiscountCreateParams): Promise<OrderDiscount>;

  // Shipping
  findShippingByOrder(orderId: string): Promise<OrderShipping[]>;
  createShipping(params: OrderShippingCreateParams): Promise<OrderShipping>;
  updateShipping(orderShippingId: string, params: OrderShippingUpdateParams): Promise<OrderShipping | null>;

  // Shipping Rates
  findShippingRatesByOrder(orderId: string): Promise<OrderShippingRate[]>;
  createShippingRate(params: OrderShippingRateCreateParams): Promise<OrderShippingRate>;

  // Tax
  findTaxesByOrder(orderId: string): Promise<OrderTax[]>;
  createTax(params: OrderTaxCreateParams): Promise<OrderTax>;

  // Payments
  findPaymentsByOrder(orderId: string): Promise<OrderPayment[]>;
  findPaymentById(orderPaymentId: string): Promise<OrderPayment | null>;
  createPayment(params: OrderPaymentCreateParams): Promise<OrderPayment>;

  // Payment Refunds
  findRefundsByOrder(orderId: string): Promise<OrderPaymentRefund[]>;
  findRefundById(orderPaymentRefundId: string): Promise<OrderPaymentRefund | null>;
  createRefund(params: OrderPaymentRefundCreateParams): Promise<OrderPaymentRefund>;
}
