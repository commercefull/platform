import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';
import type { OrderNote as DbOrderNote, OrderPaymentRefund as DbOrderPaymentRefund, OrderShipping as DbOrderShipping, OrderShippingRate as DbOrderShippingRate, OrderTax as DbOrderTax } from '../../../../libs/db/types';
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

import type { OrderNote, OrderNoteCreateParams } from '../../domain/repositories/OrderNoteRepository';
export type { OrderNote, OrderNoteCreateParams } from '../../domain/repositories/OrderNoteRepository';

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
  /** Polymorphic operand: percentage or fixed amount. */
  value: number;
  /** Discount amount in integer cents. */
  discountAmountCents: number;
}
export type OrderDiscountCreateParams = Omit<OrderDiscount, 'orderDiscountId' | 'createdAt' | 'updatedAt'>;

import type {
  OrderShipping,
  OrderShippingCreateParams,
  OrderShippingUpdateParams,
} from '../../domain/repositories/OrderShippingRepository';
export type {
  OrderShipping,
  OrderShippingCreateParams,
  OrderShippingUpdateParams,
} from '../../domain/repositories/OrderShippingRepository';
import type { ShippingCarrier, OrderShippingRate, OrderShippingRateCreateParams } from '../../domain/repositories/OrderShippingRateRepository';
export type {
  ShippingCarrier,
  OrderShippingRate,
  OrderShippingRateCreateParams,
} from '../../domain/repositories/OrderShippingRateRepository';
import type { OrderTax, OrderTaxCreateParams } from '../../domain/repositories/OrderTaxRepository';
export type { OrderTax, OrderTaxCreateParams } from '../../domain/repositories/OrderTaxRepository';

export type OrderPaymentType =
  'creditCard' | 'debitCard' | 'paypal' | 'applePay' | 'googlePay' | 'bankTransfer' | 'crypto' | 'giftCard' | 'storeCredit';
export type OrderPaymentStatus = 'pending' | 'authorized' | 'captured' | 'refunded' | 'partiallyRefunded' | 'voided' | 'failed';
export interface OrderPayment {
  orderPaymentId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  paymentMethodId?: string;
  type: OrderPaymentType;
  provider: string;
  amountCents: number;
  currency: string;
  status: OrderPaymentStatus;
  transactionId?: string;
  authorizationCode?: string;
  errorCode?: string;
  errorMessage?: string;
  maskedNumber?: string;
  cardType?: string;
  gatewayResponse?: Record<string, unknown>;
  refundedAmountCents: number;
  capturedAt?: string;
}
export type OrderPaymentCreateParams = Omit<OrderPayment, 'orderPaymentId' | 'createdAt' | 'updatedAt'>;

import type { OrderPaymentRefundStatus } from '../../domain/repositories/OrderPaymentRefundRepository';
export type { OrderPaymentRefundStatus } from '../../domain/repositories/OrderPaymentRefundRepository';
import type {
  OrderPaymentRefund,
  OrderPaymentRefundCreateParams,
} from '../../domain/repositories/OrderPaymentRefundRepository';
export type {
  OrderPaymentRefund,
  OrderPaymentRefundCreateParams,
} from '../../domain/repositories/OrderPaymentRefundRepository';

// ============================================================================
// Consolidated Order Query Repository
// ============================================================================

const iso = (d: Date | string | null | undefined): string | undefined =>
  d == null ? undefined : d instanceof Date ? d.toISOString() : String(d);
const isoReq = (d: Date | string): string => (d instanceof Date ? d.toISOString() : String(d));

function mapToNote(row: DbOrderNote): OrderNote {
  return {
    ...row,
    createdBy: row.createdBy ?? undefined,
    deletedAt: iso(row.deletedAt),
    createdAt: isoReq(row.createdAt),
    updatedAt: isoReq(row.updatedAt),
  };
}

function mapToShipping(row: DbOrderShipping): OrderShipping {
  return {
    ...row,
    carrier: row.carrier ?? undefined,
    service: row.service ?? undefined,
    taxAmountCents: row.taxAmountCents ?? undefined,
    trackingNumber: row.trackingNumber ?? undefined,
    trackingUrl: row.trackingUrl ?? undefined,
    estimatedDeliveryDate: iso(row.estimatedDeliveryDate),
    createdAt: isoReq(row.createdAt),
    updatedAt: isoReq(row.updatedAt),
  };
}

function mapToShippingRate(row: DbOrderShippingRate): OrderShippingRate {
  return {
    ...row,
    carrier: row.carrier as ShippingCarrier,
    estimatedDays: row.estimatedDays ?? undefined,
    estimatedDeliveryDate: iso(row.estimatedDeliveryDate),
    carrierAccountId: row.carrierAccountId ?? undefined,
    shipmentId: row.shipmentId ?? undefined,
    rateData: (row.rateData as Record<string, unknown> | null) ?? undefined,
    createdAt: isoReq(row.createdAt),
    updatedAt: isoReq(row.updatedAt),
  };
}

function mapToTax(row: DbOrderTax): OrderTax {
  return {
    ...row,
    orderItemId: row.orderItemId ?? undefined,
    rate: Number(row.rate),
    jurisdiction: row.jurisdiction ?? undefined,
    taxProvider: row.taxProvider ?? undefined,
    providerTaxId: row.providerTaxId ?? undefined,
    createdAt: isoReq(row.createdAt),
    updatedAt: isoReq(row.updatedAt),
  };
}

function mapToRefund(row: DbOrderPaymentRefund): OrderPaymentRefund {
  return {
    ...row,
    reason: row.reason ?? undefined,
    notes: row.notes ?? undefined,
    transactionId: row.transactionId ?? undefined,
    status: row.status as OrderPaymentRefundStatus,
    gatewayResponse: (row.gatewayResponse as Record<string, unknown> | null) ?? undefined,
    refundedBy: row.refundedBy ?? undefined,
    createdAt: isoReq(row.createdAt),
    updatedAt: isoReq(row.updatedAt),
  };
}

class OrderQueryRepo {
  // --- Order Notes ---

  async findNotesByOrder(orderId: string): Promise<OrderNote[]> {
    const results = await query<DbOrderNote[]>(
      `SELECT * FROM "orderNote" WHERE "orderId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" ASC`,
      [orderId],
    );
    return (results || []).map(mapToNote);
  }

  async createNote(params: OrderNoteCreateParams): Promise<OrderNote> {
    const now = unixTimestamp();
    const result = await queryOne<DbOrderNote>(
      `INSERT INTO "orderNote" (
        "orderId", "content", "isCustomerVisible", "createdBy",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [params.orderId, params.content, params.isCustomerVisible ?? false, params.createdBy || null, now, now],
    );
    if (!result) throw new FailedToCreateOrderNoteError();
    return mapToNote(result);
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
        "type", "value", "discountAmountCents",
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
        params.discountAmountCents,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderDiscountError();
    return result;
  }

  // --- Order Shipping ---

  async findShippingByOrder(orderId: string): Promise<OrderShipping[]> {
    const results = await query<DbOrderShipping[]>(`SELECT * FROM "orderShipping" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`, [orderId]);
    return (results || []).map(mapToShipping);
  }

  async createShipping(params: OrderShippingCreateParams): Promise<OrderShipping> {
    const now = unixTimestamp();
    const result = await queryOne<DbOrderShipping>(
      `INSERT INTO "orderShipping" (
        "orderId", "shippingMethod", "carrier", "service", "amountCents",
        "taxAmountCents", "trackingNumber", "trackingUrl", "estimatedDeliveryDate",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        params.orderId,
        params.shippingMethod,
        params.carrier || null,
        params.service || null,
        params.amountCents,
        params.taxAmountCents || null,
        params.trackingNumber || null,
        params.trackingUrl || null,
        params.estimatedDeliveryDate || null,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderShippingError();
    return mapToShipping(result);
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
      const row = await queryOne<DbOrderShipping>(`SELECT * FROM "orderShipping" WHERE "orderShippingId" = $1`, [orderShippingId]);
      return row ? mapToShipping(row) : null;
    }

    fields.push(`"updatedAt" = $${i++}`);
    values.push(unixTimestamp());
    values.push(orderShippingId);

    const row = await queryOne<DbOrderShipping>(`UPDATE "orderShipping" SET ${fields.join(', ')} WHERE "orderShippingId" = $${i} RETURNING *`, values);
    return row ? mapToShipping(row) : null;
  }

  // --- Order Shipping Rates ---

  async findShippingRatesByOrder(orderId: string): Promise<OrderShippingRate[]> {
    const results = await query<DbOrderShippingRate[]>(`SELECT * FROM "orderShippingRate" WHERE "orderId" = $1 ORDER BY "rateCents" ASC`, [
      orderId,
    ]);
    return (results || []).map(mapToShippingRate);
  }

  async createShippingRate(params: OrderShippingRateCreateParams): Promise<OrderShippingRate> {
    const now = unixTimestamp();
    const result = await queryOne<DbOrderShippingRate>(
      `INSERT INTO "orderShippingRate" (
        "orderId", "carrier", "serviceLevel", "serviceName", "rateCents",
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
        params.rateCents,
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
    return mapToShippingRate(result);
  }

  // --- Order Tax ---

  async findTaxesByOrder(orderId: string): Promise<OrderTax[]> {
    const results = await query<DbOrderTax[]>(`SELECT * FROM "orderTax" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`, [orderId]);
    return (results || []).map(mapToTax);
  }

  async createTax(params: OrderTaxCreateParams): Promise<OrderTax> {
    const now = unixTimestamp();
    const result = await queryOne<DbOrderTax>(
      `INSERT INTO "orderTax" (
        "orderId", "orderItemId", "taxType", "name", "rate", "amountCents",
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
        params.amountCents,
        params.jurisdiction || null,
        params.taxProvider || null,
        params.providerTaxId || null,
        params.isIncludedInPrice ?? false,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderTaxError();
    return mapToTax(result);
  }

  // --- Order Payments ---

  private toOrderPayment(row: Omit<OrderPayment, 'currency'> & { currencyCode?: string }): OrderPayment {
    const { currencyCode, ...rest } = row;
    return { ...rest, currency: currencyCode ?? 'USD' } as OrderPayment;
  }

  async findPaymentsByOrder(orderId: string): Promise<OrderPayment[]> {
    const results = await query<OrderPayment[]>(`SELECT * FROM "orderPayment" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`, [orderId]);
    return (results || []).map(row => this.toOrderPayment(row));
  }

  async findPaymentById(orderPaymentId: string): Promise<OrderPayment | null> {
    const row = await queryOne<OrderPayment>(`SELECT * FROM "orderPayment" WHERE "orderPaymentId" = $1`, [orderPaymentId]);
    return row ? this.toOrderPayment(row) : null;
  }

  async createPayment(params: OrderPaymentCreateParams): Promise<OrderPayment> {
    const now = unixTimestamp();
    const result = await queryOne<OrderPayment>(
      `INSERT INTO "orderPayment" (
        "orderId", "paymentMethodId", "type", "provider", "amountCents", "currencyCode", "status",
        "transactionId", "authorizationCode", "errorCode", "errorMessage",
        "maskedNumber", "cardType", "gatewayResponse", "refundedAmountCents", "capturedAt",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        params.orderId,
        params.paymentMethodId || null,
        params.type,
        params.provider,
        params.amountCents,
        params.currency,
        params.status || 'pending',
        params.transactionId || null,
        params.authorizationCode || null,
        params.errorCode || null,
        params.errorMessage || null,
        params.maskedNumber || null,
        params.cardType || null,
        params.gatewayResponse ? JSON.stringify(params.gatewayResponse) : null,
        params.refundedAmountCents ?? 0,
        params.capturedAt || null,
        now,
        now,
      ],
    );
    if (!result) throw new FailedToCreateOrderPaymentError();
    return this.toOrderPayment(result);
  }

  // --- Order Payment Refunds ---

  async findRefundsByOrder(orderId: string): Promise<OrderPaymentRefund[]> {
    const results = await query<DbOrderPaymentRefund[]>(
      `SELECT r.* FROM "orderPaymentRefund" r
       JOIN "orderPayment" p ON p."orderPaymentId" = r."orderPaymentId"
       WHERE p."orderId" = $1
       ORDER BY r."createdAt" ASC`,
      [orderId],
    );
    return (results || []).map(mapToRefund);
  }

  async findRefundById(orderPaymentRefundId: string): Promise<OrderPaymentRefund | null> {
    const row = await queryOne<DbOrderPaymentRefund>(`SELECT * FROM "orderPaymentRefund" WHERE "orderPaymentRefundId" = $1`, [orderPaymentRefundId]);
    return row ? mapToRefund(row) : null;
  }

  async createRefund(params: OrderPaymentRefundCreateParams): Promise<OrderPaymentRefund> {
    const now = unixTimestamp();
    const result = await queryOne<DbOrderPaymentRefund>(
      `INSERT INTO "orderPaymentRefund" (
        "orderPaymentId", "amountCents", "reason", "notes", "transactionId",
        "status", "gatewayResponse", "refundedBy",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        params.orderPaymentId,
        params.amountCents,
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
    return mapToRefund(result);
  }
}

export default new OrderQueryRepo();
