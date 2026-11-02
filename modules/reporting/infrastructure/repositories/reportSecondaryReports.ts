/**
 * Secondary report generators — extracted from reportDataProvider.
 */

import { query, queryOne } from '../../../../libs/db';
import type { ReportData } from '../../domain/entities/ReportEntities';
import type { ReportParameters } from './reportParams';

// ============================================================================
// Tax Report
// ============================================================================

export async function generateTaxReport(from: Date, to: Date, _params: ReportParameters): Promise<ReportData> {
  interface TaxReportRow {
    orderId: string;
    orderNumber: string;
    createdAt: string;
    countryCode: string;
    region: string;
    taxRate: string;
    taxAmount: string;
    totalAmount: string;
  }

  interface TaxReportSummary {
    totalTaxedOrders: string;
    totalTaxCollected: string;
    totalTaxableRevenue: string;
  }

  const rows = await query<TaxReportRow[]>(
    `SELECT
      o."orderId",
      o."orderNumber",
      o."createdAt",
      o."shippingAddress"->>'countryCode' as "countryCode",
      o."shippingAddress"->>'state' as "region",
      ROUND(o."taxTotalCents"::numeric / NULLIF(o."subtotalCents", 0) * 100, 2) as "taxRate",
      o."taxTotalCents" / 100.0 as "taxAmount",
      o."totalAmountCents" / 100.0 as "totalAmount"
     FROM "order" o
     WHERE o."createdAt" >= $1 AND o."createdAt" <= $2
       AND o."deletedAt" IS NULL
       AND o."taxTotalCents" > 0
     ORDER BY o."createdAt" ASC`,
    [from, to],
  );

  const summary = await queryOne<TaxReportSummary>(
    `SELECT
      COUNT(*) as "totalTaxedOrders",
      COALESCE(SUM(o."taxTotalCents"), 0) / 100.0 as "totalTaxCollected",
      COALESCE(SUM(o."totalAmountCents"), 0) / 100.0 as "totalTaxableRevenue"
     FROM "order" o
     WHERE o."createdAt" >= $1 AND o."createdAt" <= $2
       AND o."deletedAt" IS NULL
       AND o."taxTotalCents" > 0`,
    [from, to],
  );

  return {
    reportType: 'tax_report',
    generatedAt: new Date(),
    dateRange: { from, to },
    summary: {
      totalTaxedOrders: parseInt(summary?.totalTaxedOrders || '0'),
      totalTaxCollected: parseFloat(summary?.totalTaxCollected || '0'),
      totalTaxableRevenue: parseFloat(summary?.totalTaxableRevenue || '0'),
    },
    rows: (rows || []).map(r => ({
      orderId: r.orderId,
      orderNumber: r.orderNumber,
      date: r.createdAt,
      country: r.countryCode,
      region: r.region,
      taxRate: parseFloat(r.taxRate || '0'),
      taxAmount: parseFloat(r.taxAmount || '0'),
      totalAmount: parseFloat(r.totalAmount || '0'),
    })),
  };
}

// ============================================================================
// Order Detail Report
// ============================================================================

export async function generateOrderDetail(from: Date, to: Date, params: ReportParameters): Promise<ReportData> {
  let whereClause = `WHERE o."createdAt" >= $1 AND o."createdAt" <= $2 AND o."deletedAt" IS NULL`;
  const values: unknown[] = [from, to];
  let idx = 3;

  if (params.status) {
    whereClause += ` AND o."status" = $${idx++}`;
    values.push(params.status);
  }
  if (params.storeId) {
    whereClause += ` AND o."storeId" = $${idx}`;
    values.push(params.storeId);
  }

  const rows =
    (await query<Record<string, string>[]>(
      `SELECT
      o."orderId",
      o."orderNumber",
      o."status",
      o."createdAt",
      o."customerName",
      o."customerEmail",
      o."totalAmountCents" / 100.0 as "totalAmount",
      o."totalItems" as "itemCount",
      (SELECT f."shippingMethodName" FROM "fulfillment" f WHERE f."orderId" = o."orderId"::text ORDER BY f."createdAt" DESC LIMIT 1) as "shippingMethod",
      (SELECT op."type" FROM "orderPayment" op WHERE op."orderId" = o."orderId" ORDER BY op."createdAt" DESC LIMIT 1) as "paymentMethod"
     FROM "order" o
     ${whereClause}
     ORDER BY o."createdAt" DESC
     LIMIT 500`,
      values,
    )) || [];

  return {
    reportType: 'order_detail',
    generatedAt: new Date(),
    dateRange: { from, to },
    summary: { totalOrders: rows.length },
    rows: rows.map((r: Record<string, string>) => ({
      orderId: r.orderId,
      orderNumber: r.orderNumber,
      status: r.status,
      date: r.createdAt,
      customerName: r.customerName || '',
      customerEmail: r.customerEmail || '',
      totalAmount: parseFloat(r.totalAmount || '0'),
      itemCount: parseInt(r.itemCount || '0'),
      shippingMethod: r.shippingMethod || '',
      paymentMethod: r.paymentMethod || '',
    })),
  };
}

// ============================================================================
// Payment Report
// ============================================================================

export async function generatePaymentReport(from: Date, to: Date, _params: ReportParameters): Promise<ReportData> {
  const rows =
    (await query<Record<string, string>[]>(
      `SELECT
      p."orderPaymentId" as "paymentId",
      p."orderId",
      p."type" as "paymentMethod",
      p."provider" as "gateway",
      p."amountCents" / 100.0 as "amount",
      p."status",
      p."createdAt"
     FROM "orderPayment" p
     WHERE p."createdAt" >= $1 AND p."createdAt" <= $2
     ORDER BY p."createdAt" DESC
     LIMIT 500`,
      [from, to],
    )) || [];

  const summary = await queryOne<Record<string, string>>(
    `SELECT
      COUNT(*) as "totalPayments",
      COALESCE(SUM(p."amountCents"), 0) / 100.0 as "totalAmount",
      COUNT(CASE WHEN p."status" = 'captured' THEN 1 END) as "completedPayments",
      COUNT(CASE WHEN p."status" = 'refunded' THEN 1 END) as "refundedPayments",
      COALESCE(SUM(CASE WHEN p."status" = 'refunded' THEN p."amountCents" ELSE 0 END), 0) / 100.0 as "refundedAmount"
     FROM "orderPayment" p
     WHERE p."createdAt" >= $1 AND p."createdAt" <= $2`,
    [from, to],
  );

  return {
    reportType: 'payment_report',
    generatedAt: new Date(),
    dateRange: { from, to },
    summary: {
      totalPayments: parseInt(summary?.totalPayments || '0'),
      totalAmount: parseFloat(summary?.totalAmount || '0'),
      completedPayments: parseInt(summary?.completedPayments || '0'),
      refundedPayments: parseInt(summary?.refundedPayments || '0'),
      refundedAmount: parseFloat(summary?.refundedAmount || '0'),
    },
    rows: rows.map((r: Record<string, string>) => ({
      paymentId: r.paymentId,
      orderId: r.orderId,
      paymentMethod: r.paymentMethod || '',
      gateway: r.gateway || '',
      amount: parseFloat(r.amount || '0'),
      status: r.status,
      date: r.createdAt,
    })),
  };
}

// ============================================================================
// Fulfillment Report
// ============================================================================

export async function generateFulfillmentReport(from: Date, to: Date, _params: ReportParameters): Promise<ReportData> {
  const rows =
    (await query<Record<string, string>[]>(
      `SELECT
      f."fulfillmentId",
      f."orderId",
      f."status",
      f."carrierName" as "carrier",
      f."trackingNumber",
      f."createdAt",
      f."shippedAt",
      f."deliveredAt",
      EXTRACT(EPOCH FROM (COALESCE(f."deliveredAt", NOW()) - f."createdAt"))/86400 as "deliveryDays"
     FROM "fulfillment" f
     WHERE f."createdAt" >= $1 AND f."createdAt" <= $2
     ORDER BY f."createdAt" DESC
     LIMIT 500`,
      [from, to],
    )) || [];

  const summary = await queryOne<Record<string, string>>(
    `SELECT
      COUNT(*) as "totalFulfillments",
      COUNT(CASE WHEN f."status" = 'delivered' THEN 1 END) as "deliveredCount",
      COUNT(CASE WHEN f."status" = 'shipped' THEN 1 END) as "shippedCount",
      COUNT(CASE WHEN f."status" = 'pending' THEN 1 END) as "pendingCount",
      COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(f."deliveredAt", NOW()) - f."createdAt"))/86400), 0) as "avgDeliveryDays"
     FROM "fulfillment" f
     WHERE f."createdAt" >= $1 AND f."createdAt" <= $2`,
    [from, to],
  );

  return {
    reportType: 'fulfillment_report',
    generatedAt: new Date(),
    dateRange: { from, to },
    summary: {
      totalFulfillments: parseInt(summary?.totalFulfillments || '0'),
      deliveredCount: parseInt(summary?.deliveredCount || '0'),
      shippedCount: parseInt(summary?.shippedCount || '0'),
      pendingCount: parseInt(summary?.pendingCount || '0'),
      avgDeliveryDays: parseFloat(summary?.avgDeliveryDays || '0'),
    },
    rows: rows.map((r: Record<string, string>) => ({
      fulfillmentId: r.fulfillmentId,
      orderId: r.orderId,
      status: r.status,
      carrier: r.carrier || '',
      trackingNumber: r.trackingNumber || '',
      createdAt: r.createdAt,
      shippedAt: r.shippedAt,
      deliveredAt: r.deliveredAt,
      deliveryDays: parseFloat(r.deliveryDays || '0'),
    })),
  };
}
