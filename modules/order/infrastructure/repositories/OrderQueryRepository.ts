import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import {
  FailedToCreateOrderNoteError,
  FailedToCreateOrderDiscountError,
  FailedToCreateOrderShippingError,
  FailedToCreateOrderShippingRateError,
  FailedToCreateOrderTaxError,
  FailedToCreateOrderPaymentError,
  FailedToCreateOrderPaymentRefundError,
} from '../../domain/errors/OrderErrors';

// ============================================================================
// Types — re-exported from the old sub-repos for backward compatibility
// ============================================================================

export interface OrderNote {
  orderNoteId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  content: string;
  isCustomerVisible: boolean;
  createdBy?: string;
  deletedAt?: string;
}
export type OrderNoteCreateParams = Omit<OrderNote, 'orderNoteId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export type DiscountType = 'percentage' | 'fixedAmount' | 'freeShipping' | 'buyXGetY' | 'giftCard';
export interface OrderDiscount {
  orderDiscountId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  orderItemId?: string;
  code?: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  discountAmount: number;
}
export type OrderDiscountCreateParams = Omit<OrderDiscount, 'orderDiscountId' | 'createdAt' | 'updatedAt'>;

export interface OrderShipping {
  orderShippingId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  shippingMethod: string;
  carrier?: string;
  service?: string;
  amount: number;
  taxAmount?: number;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
}
export type OrderShippingCreateParams = Omit<OrderShipping, 'orderShippingId' | 'createdAt' | 'updatedAt'>;
export type OrderShippingUpdateParams = Partial<
  Pick<OrderShipping, 'shippingMethod' | 'carrier' | 'service' | 'amount' | 'taxAmount' | 'trackingNumber' | 'trackingUrl' | 'estimatedDeliveryDate'>
>;

export type ShippingCarrier = 'ups' | 'usps' | 'fedex' | 'dhl' | 'custom';
export interface OrderShippingRate {
  orderShippingRateId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  carrier: ShippingCarrier;
  serviceLevel: string;
  serviceName: string;
  rate: number;
  estimatedDays?: number;
  estimatedDeliveryDate?: string;
  currencyCode: string;
  isSelected: boolean;
  carrierAccountId?: string;
  shipmentId?: string;
  rateData?: Record<string, unknown>;
}
export type OrderShippingRateCreateParams = Omit<OrderShippingRate, 'orderShippingRateId' | 'createdAt' | 'updatedAt'>;

export interface OrderTax {
  orderTaxId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  orderItemId?: string;
  taxType: string;
  name: string;
  rate: number;
  amount: number;
  jurisdiction?: string;
  taxProvider?: string;
  providerTaxId?: string;
  isIncludedInPrice: boolean;
}
export type OrderTaxCreateParams = Omit<OrderTax, 'orderTaxId' | 'createdAt' | 'updatedAt'>;

export type OrderPaymentType =
  | 'creditCard'
  | 'debitCard'
  | 'paypal'
  | 'applePay'
  | 'googlePay'
  | 'bankTransfer'
  | 'crypto'
  | 'giftCard'
  | 'storeCredit';
export type OrderPaymentStatus = 'pending' | 'authorized' | 'captured' | 'refunded' | 'partiallyRefunded' | 'voided' | 'failed';
export interface OrderPayment {
  orderPaymentId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  paymentMethodId?: string;
  type: OrderPaymentType;
  provider: string;
  amount: number;
  currency: string;
  status: OrderPaymentStatus;
  transactionId?: string;
  authorizationCode?: string;
  errorCode?: string;
  errorMessage?: string;
  maskedNumber?: string;
  cardType?: string;
  gatewayResponse?: Record<string, unknown>;
  refundedAmount: number;
  capturedAt?: string;
}
export type OrderPaymentCreateParams = Omit<OrderPayment, 'orderPaymentId' | 'createdAt' | 'updatedAt'>;

export type OrderPaymentRefundStatus = 'pending' | 'completed' | 'failed';
export interface OrderPaymentRefund {
  orderPaymentRefundId: string;
  createdAt: string;
  updatedAt: string;
  orderPaymentId: string;
  amount: number;
  reason?: string;
  notes?: string;
  transactionId?: string;
  status: OrderPaymentRefundStatus;
  gatewayResponse?: Record<string, unknown>;
  refundedBy?: string;
}
export type OrderPaymentRefundCreateParams = Omit<OrderPaymentRefund, 'orderPaymentRefundId' | 'createdAt' | 'updatedAt'>;

// ============================================================================
// Consolidated Order Query Repository
// ============================================================================

class OrderQueryRepo {
  // --- Order Notes ---

  async findNotesByOrder(orderId: string): Promise<OrderNote[]> {
    const results = await query<OrderNote[]>(
      `SELECT * FROM "orderNote" WHERE "orderId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" ASC`,
      [orderId],
    );
    return results || [];
  }

  async createNote(params: OrderNoteCreateParams): Promise<OrderNote> {
    const now = unixTimestamp();
    const result = await queryOne<OrderNote>(
      `INSERT INTO "orderNote" (
        "orderId", "content", "isCustomerVisible", "createdBy",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [params.orderId, params.content, params.isCustomerVisible ?? false, params.createdBy || null, now, now],
    );
    if (!result) throw new FailedToCreateOrderNoteError();
    return result;
  }

  async softDeleteNote(orderNoteId: string): Promise<boolean> {
    const result = await queryOne<{ orderNoteId: string }>(
      `UPDATE "orderNote" SET "deletedAt" = $1, "updatedAt" = $2 WHERE "orderNoteId" = $3 AND "deletedAt" IS NULL RETURNING "orderNoteId"`,
      [unixTimestamp(), unixTimestamp(), orderNoteId],
    );
    return !!result;
  }

  // --- Order Discounts ---

  async findDiscountsByOrder(orderId: string): Promise<OrderDiscount[]> {
    const results = await query<OrderDiscount[]>(`SELECT * FROM "orderDiscount" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`, [orderId]);
    return results || [];
  }

  async createDiscount(params: OrderDiscountCreateParams): Promise<OrderDiscount> {
    const now = unixTimestamp();
    const result = await queryOne<OrderDiscount>(
      `INSERT INTO "orderDiscount" (
        "orderId", "orderItemId", "code", "name", "description",
        "type", "value", "discountAmount",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        params.orderId,
        params.orderItemId || null,
        params.code || null,
        params.name,
        params.description || null,
        params.type,
        params.value,
        params.discountAmount,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderDiscountError();
    return result;
  }

  // --- Order Shipping ---

  async findShippingByOrder(orderId: string): Promise<OrderShipping[]> {
    const results = await query<OrderShipping[]>(`SELECT * FROM "orderShipping" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`, [orderId]);
    return results || [];
  }

  async createShipping(params: OrderShippingCreateParams): Promise<OrderShipping> {
    const now = unixTimestamp();
    const result = await queryOne<OrderShipping>(
      `INSERT INTO "orderShipping" (
        "orderId", "shippingMethod", "carrier", "service", "amount",
        "taxAmount", "trackingNumber", "trackingUrl", "estimatedDeliveryDate",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        params.orderId,
        params.shippingMethod,
        params.carrier || null,
        params.service || null,
        params.amount,
        params.taxAmount || null,
        params.trackingNumber || null,
        params.trackingUrl || null,
        params.estimatedDeliveryDate || null,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderShippingError();
    return result;
  }

  async updateShipping(orderShippingId: string, params: OrderShippingUpdateParams): Promise<OrderShipping | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        fields.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return queryOne<OrderShipping>(`SELECT * FROM "orderShipping" WHERE "orderShippingId" = $1`, [orderShippingId]);
    }

    fields.push(`"updatedAt" = $${i++}`);
    values.push(unixTimestamp());
    values.push(orderShippingId);

    return queryOne<OrderShipping>(`UPDATE "orderShipping" SET ${fields.join(', ')} WHERE "orderShippingId" = $${i} RETURNING *`, values);
  }

  // --- Order Shipping Rates ---

  async findShippingRatesByOrder(orderId: string): Promise<OrderShippingRate[]> {
    const results = await query<OrderShippingRate[]>(`SELECT * FROM "orderShippingRate" WHERE "orderId" = $1 ORDER BY "rate" ASC`, [orderId]);
    return results || [];
  }

  async createShippingRate(params: OrderShippingRateCreateParams): Promise<OrderShippingRate> {
    const now = unixTimestamp();
    const result = await queryOne<OrderShippingRate>(
      `INSERT INTO "orderShippingRate" (
        "orderId", "carrier", "serviceLevel", "serviceName", "rate",
        "estimatedDays", "estimatedDeliveryDate", "currencyCode", "isSelected",
        "carrierAccountId", "shipmentId", "rateData",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        params.orderId,
        params.carrier,
        params.serviceLevel,
        params.serviceName,
        params.rate,
        params.estimatedDays || null,
        params.estimatedDeliveryDate || null,
        params.currencyCode || 'USD',
        params.isSelected ?? false,
        params.carrierAccountId || null,
        params.shipmentId || null,
        params.rateData ? JSON.stringify(params.rateData) : null,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderShippingRateError();
    return result;
  }

  // --- Order Tax ---

  async findTaxesByOrder(orderId: string): Promise<OrderTax[]> {
    const results = await query<OrderTax[]>(`SELECT * FROM "orderTax" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`, [orderId]);
    return results || [];
  }

  async createTax(params: OrderTaxCreateParams): Promise<OrderTax> {
    const now = unixTimestamp();
    const result = await queryOne<OrderTax>(
      `INSERT INTO "orderTax" (
        "orderId", "orderItemId", "taxType", "name", "rate", "amount",
        "jurisdiction", "taxProvider", "providerTaxId", "isIncludedInPrice",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        params.orderId,
        params.orderItemId || null,
        params.taxType,
        params.name,
        params.rate,
        params.amount,
        params.jurisdiction || null,
        params.taxProvider || null,
        params.providerTaxId || null,
        params.isIncludedInPrice ?? false,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderTaxError();
    return result;
  }

  // --- Order Payments ---

  async findPaymentsByOrder(orderId: string): Promise<OrderPayment[]> {
    const results = await query<OrderPayment[]>(`SELECT * FROM "orderPayment" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`, [orderId]);
    return results || [];
  }

  async findPaymentById(orderPaymentId: string): Promise<OrderPayment | null> {
    return queryOne<OrderPayment>(`SELECT * FROM "orderPayment" WHERE "orderPaymentId" = $1`, [orderPaymentId]);
  }

  async createPayment(params: OrderPaymentCreateParams): Promise<OrderPayment> {
    const now = unixTimestamp();
    const result = await queryOne<OrderPayment>(
      `INSERT INTO "orderPayment" (
        "orderId", "paymentMethodId", "type", "provider", "amount", "currency", "status",
        "transactionId", "authorizationCode", "errorCode", "errorMessage",
        "maskedNumber", "cardType", "gatewayResponse", "refundedAmount", "capturedAt",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        params.orderId,
        params.paymentMethodId || null,
        params.type,
        params.provider,
        params.amount,
        params.currency,
        params.status || 'pending',
        params.transactionId || null,
        params.authorizationCode || null,
        params.errorCode || null,
        params.errorMessage || null,
        params.maskedNumber || null,
        params.cardType || null,
        params.gatewayResponse ? JSON.stringify(params.gatewayResponse) : null,
        params.refundedAmount ?? 0,
        params.capturedAt || null,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderPaymentError();
    return result;
  }

  // --- Order Payment Refunds ---

  async findRefundsByOrder(orderId: string): Promise<OrderPaymentRefund[]> {
    const results = await query<OrderPaymentRefund[]>(
      `SELECT r.* FROM "orderPaymentRefund" r
       JOIN "orderPayment" p ON p."orderPaymentId" = r."orderPaymentId"
       WHERE p."orderId" = $1
       ORDER BY r."createdAt" ASC`,
      [orderId],
    );
    return results || [];
  }

  async findRefundById(orderPaymentRefundId: string): Promise<OrderPaymentRefund | null> {
    return queryOne<OrderPaymentRefund>(`SELECT * FROM "orderPaymentRefund" WHERE "orderPaymentRefundId" = $1`, [orderPaymentRefundId]);
  }

  async createRefund(params: OrderPaymentRefundCreateParams): Promise<OrderPaymentRefund> {
    const now = unixTimestamp();
    const result = await queryOne<OrderPaymentRefund>(
      `INSERT INTO "orderPaymentRefund" (
        "orderPaymentId", "amount", "reason", "notes", "transactionId",
        "status", "gatewayResponse", "refundedBy",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        params.orderPaymentId,
        params.amount,
        params.reason || null,
        params.notes || null,
        params.transactionId || null,
        params.status || 'pending',
        params.gatewayResponse ? JSON.stringify(params.gatewayResponse) : null,
        params.refundedBy || null,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderPaymentRefundError();
    return result;
  }
}

export default new OrderQueryRepo();
