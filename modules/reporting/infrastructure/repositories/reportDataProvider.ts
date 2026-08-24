/**
 * Report Data Provider
 *
 * Collaborates with the analytics module and other core modules
 * to gather data for report generation.
 */

import { query, queryOne } from '../../../../libs/db';
import type { ReportData, ReportType } from '../../domain/entities/ReportEntities';
import { UnknownReportTypeError } from '../../domain/errors/ReportingErrors';

export interface ReportParameters {
  dateFrom?: string;
  dateTo?: string;
  storeId?: string;
  organizationId?: string;
  categoryId?: string;
  customerGroupId?: string;
  warehouseId?: string;
  lowStockOnly?: boolean;
  region?: string;
  taxClassId?: string;
  status?: string;
  paymentMethod?: string;
  gateway?: string;
  carrierId?: string;
  limit?: number;
}

export async function generateReport(
  reportType: ReportType,
  params: ReportParameters,
): Promise<ReportData> {
  const now = new Date();
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
  const dateTo = params.dateTo ? new Date(params.dateTo) : now;

  switch (reportType) {
    case 'sales_summary':
      return generateSalesSummary(dateFrom, dateTo, params);
    case 'product_performance':
      return generateProductPerformance(dateFrom, dateTo, params);
    case 'customer_summary':
      return generateCustomerSummary(dateFrom, dateTo, params);
    case 'inventory_report':
      return generateInventoryReport(params);
    case 'tax_report':
      return generateTaxReport(dateFrom, dateTo, params);
    case 'order_detail':
      return generateOrderDetail(dateFrom, dateTo, params);
    case 'payment_report':
      return generatePaymentReport(dateFrom, dateTo, params);
    case 'fulfillment_report':
      return generateFulfillmentReport(dateFrom, dateTo, params);
    default:
      throw new UnknownReportTypeError(reportType);
  }
}

// ============================================================================
// Sales Summary Report
// ============================================================================

async function generateSalesSummary(from: Date, to: Date, params: ReportParameters): Promise<ReportData> {
  let whereClause = `WHERE o."createdAt" >= $1 AND o."createdAt" <= $2 AND o."deletedAt" IS NULL`;
  const values: unknown[] = [from, to];
  let idx = 3;

  if (params.storeId) {
    whereClause += ` AND o."storeId" = $${idx}`;
    values.push(params.storeId);
  }

  const summary = await queryOne<Record<string, string>>(
    `SELECT
      COUNT(*) as "totalOrders",
      COALESCE(SUM(o."totalAmount"), 0) as "totalRevenue",
      COALESCE(AVG(o."totalAmount"), 0) as "averageOrderValue",
      COUNT(CASE WHEN o."status" = 'completed' THEN 1 END) as "completedOrders",
      COUNT(CASE WHEN o."status" = 'cancelled' THEN 1 END) as "cancelledOrders",
      COUNT(CASE WHEN o."status" = 'refunded' THEN 1 END) as "refundedOrders",
      COALESCE(SUM(CASE WHEN o."status" = 'refunded' THEN o."totalAmount" ELSE 0 END), 0) as "refundedAmount"
     FROM "order" o ${whereClause}`,
    values,
  );

  const dailyRows = (await query<Record<string, string>[]>(
    `SELECT
      DATE(o."createdAt") as "date",
      COUNT(*) as "orderCount",
      COALESCE(SUM(o."totalAmount"), 0) as "revenue"
     FROM "order" o ${whereClause}
     GROUP BY DATE(o."createdAt")
     ORDER BY "date" ASC`,
    values,
  )) || [];

  return {
    reportType: 'sales_summary',
    generatedAt: new Date(),
    dateRange: { from, to },
    summary: {
      totalOrders: parseInt(summary?.totalOrders || '0'),
      totalRevenue: parseFloat(summary?.totalRevenue || '0'),
      averageOrderValue: parseFloat(summary?.averageOrderValue || '0'),
      completedOrders: parseInt(summary?.completedOrders || '0'),
      cancelledOrders: parseInt(summary?.cancelledOrders || '0'),
      refundedOrders: parseInt(summary?.refundedOrders || '0'),
      refundedAmount: parseFloat(summary?.refundedAmount || '0'),
    },
    rows: dailyRows.map((r: Record<string, string>) => ({
      date: r.date,
      orderCount: parseInt(r.orderCount || '0'),
      revenue: parseFloat(r.revenue || '0'),
    })),
  };
}

// ============================================================================
// Product Performance Report
// ============================================================================

async function generateProductPerformance(from: Date, to: Date, params: ReportParameters): Promise<ReportData> {
  let whereClause = `WHERE o."createdAt" >= $1 AND o."createdAt" <= $2 AND o."deletedAt" IS NULL`;
  const values: unknown[] = [from, to];
  let idx = 3;

  if (params.categoryId) {
    whereClause += ` AND p."categoryId" = $${idx++}`;
    values.push(params.categoryId);
  }

  const limit = params.limit || 50;

  const rows = (await query<Record<string, string>[]>(
    `SELECT
      oi."productId",
      p."name" as "productName",
      p."sku",
      SUM(oi."quantity") as "unitsSold",
      COALESCE(SUM(oi."quantity" * oi."unitPrice"), 0) as "revenue",
      COUNT(DISTINCT o."orderId") as "orderCount"
     FROM "orderItem" oi
     JOIN "order" o ON oi."orderId" = o."orderId"
     LEFT JOIN "product" p ON oi."productId" = p."productId"
     ${whereClause}
     GROUP BY oi."productId", p."name", p."sku"
     ORDER BY "revenue" DESC
     LIMIT $${idx}`,
    [...values, limit],
  )) || [];

  const summary = await queryOne<Record<string, string>>(
    `SELECT
      COUNT(DISTINCT oi."productId") as "totalProducts",
      COALESCE(SUM(oi."quantity"), 0) as "totalUnitsSold",
      COALESCE(SUM(oi."quantity" * oi."unitPrice"), 0) as "totalRevenue"
     FROM "orderItem" oi
     JOIN "order" o ON oi."orderId" = o."orderId"
     ${whereClause}`,
    values,
  );

  return {
    reportType: 'product_performance',
    generatedAt: new Date(),
    dateRange: { from, to },
    summary: {
      totalProducts: parseInt(summary?.totalProducts || '0'),
      totalUnitsSold: parseInt(summary?.totalUnitsSold || '0'),
      totalRevenue: parseFloat(summary?.totalRevenue || '0'),
    },
    rows: rows.map((r: Record<string, string>) => ({
      productId: r.productId,
      productName: r.productName || 'Unknown',
      sku: r.sku || '',
      unitsSold: parseInt(r.unitsSold || '0'),
      revenue: parseFloat(r.revenue || '0'),
      orderCount: parseInt(r.orderCount || '0'),
    })),
  };
}

// ============================================================================
// Customer Summary Report
// ============================================================================

async function generateCustomerSummary(from: Date, to: Date, _params: ReportParameters): Promise<ReportData> {
  const summary = await queryOne<Record<string, string>>(
    `SELECT
      COUNT(*) as "totalCustomers",
      COUNT(CASE WHEN c."createdAt" >= $1 AND c."createdAt" <= $2 THEN 1 END) as "newCustomers",
      COUNT(CASE WHEN c."lastLoginAt" >= $1 THEN 1 END) as "activeCustomers"
     FROM "customer" c WHERE c."deletedAt" IS NULL`,
    [from, to],
  );

  const topCustomers = (await query<Record<string, string>[]>(
    `SELECT
      c."customerId",
      c."firstName",
      c."lastName",
      c."email",
      COUNT(o."orderId") as "orderCount",
      COALESCE(SUM(o."totalAmount"), 0) as "totalSpent"
     FROM "customer" c
     LEFT JOIN "order" o ON c."customerId" = o."customerId"
       AND o."createdAt" >= $1 AND o."createdAt" <= $2
       AND o."deletedAt" IS NULL
     WHERE c."deletedAt" IS NULL
     GROUP BY c."customerId", c."firstName", c."lastName", c."email"
     ORDER BY "totalSpent" DESC
     LIMIT 20`,
    [from, to],
  )) || [];

  return {
    reportType: 'customer_summary',
    generatedAt: new Date(),
    dateRange: { from, to },
    summary: {
      totalCustomers: parseInt(summary?.totalCustomers || '0'),
      newCustomers: parseInt(summary?.newCustomers || '0'),
      activeCustomers: parseInt(summary?.activeCustomers || '0'),
    },
    rows: topCustomers.map((r: Record<string, string>) => ({
      customerId: r.customerId,
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      email: r.email,
      orderCount: parseInt(r.orderCount || '0'),
      totalSpent: parseFloat(r.totalSpent || '0'),
    })),
  };
}

// ============================================================================
// Inventory Report
// ============================================================================

async function generateInventoryReport(params: ReportParameters): Promise<ReportData> {
  let whereClause = `WHERE i."deletedAt" IS NULL`;
  const values: unknown[] = [];
  let idx = 1;

  if (params.storeId) {
    whereClause += ` AND i."storeId" = $${idx++}`;
    values.push(params.storeId);
  }
  if (params.warehouseId) {
    whereClause += ` AND i."distributionWarehouseId" = $${idx}`;
    values.push(params.warehouseId);
  }
  if (params.lowStockOnly) {
    whereClause += ` AND i."quantity" <= COALESCE(i."minimumStockLevel", 0)`;
  }

  const rows = (await query<Record<string, string>[]>(
    `SELECT
      i."inventoryId",
      i."productId",
      p."name" as "productName",
      p."sku",
      i."quantity",
      i."reservedQuantity",
      i."minimumStockLevel",
      i."locationId",
      CASE
        WHEN i."quantity" = 0 THEN 'out_of_stock'
        WHEN i."quantity" <= COALESCE(i."minimumStockLevel", 0) THEN 'low_stock'
        ELSE 'in_stock'
      END as "stockStatus"
     FROM "inventoryLocation" i
     LEFT JOIN "product" p ON i."productId" = p."productId"
     ${whereClause}
     ORDER BY p."name" ASC`,
    values,
  )) || [];

  const summary = await queryOne<Record<string, string>>(
    `SELECT
      COUNT(*) as "totalItems",
      COALESCE(SUM(i."quantity"), 0) as "totalUnits",
      COUNT(CASE WHEN i."quantity" = 0 THEN 1 END) as "outOfStockCount",
      COUNT(CASE WHEN i."quantity" <= COALESCE(i."minimumStockLevel", 0) AND i."quantity" > 0 THEN 1 END) as "lowStockCount"
     FROM "inventoryLocation" i
     ${whereClause}`,
    values,
  );

  return {
    reportType: 'inventory_report',
    generatedAt: new Date(),
    dateRange: { from: new Date(), to: new Date() },
    summary: {
      totalItems: parseInt(summary?.totalItems || '0'),
      totalUnits: parseInt(summary?.totalUnits || '0'),
      outOfStockCount: parseInt(summary?.outOfStockCount || '0'),
      lowStockCount: parseInt(summary?.lowStockCount || '0'),
    },
    rows: rows.map((r: Record<string, string>) => ({
      inventoryId: r.inventoryId,
      productId: r.productId,
      productName: r.productName || 'Unknown',
      sku: r.sku || '',
      quantity: parseInt(r.quantity || '0'),
      reservedQuantity: parseInt(r.reservedQuantity || '0'),
      minimumStockLevel: parseInt(r.minimumStockLevel || '0'),
      stockStatus: r.stockStatus,
    })),
  };
}

// ============================================================================
// Tax Report
// ============================================================================

async function generateTaxReport(from: Date, to: Date, _params: ReportParameters): Promise<ReportData> {
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
      o."countryCode",
      o."region",
      o."taxRate",
      o."taxAmount",
      o."totalAmount"
     FROM "order" o
     WHERE o."createdAt" >= $1 AND o."createdAt" <= $2
       AND o."deletedAt" IS NULL
       AND o."taxAmount" > 0
     ORDER BY o."createdAt" ASC`,
    [from, to],
  );

  const summary = await queryOne<TaxReportSummary>(
    `SELECT
      COUNT(*) as "totalTaxedOrders",
      COALESCE(SUM(o."taxAmount"), 0) as "totalTaxCollected",
      COALESCE(SUM(o."totalAmount"), 0) as "totalTaxableRevenue"
     FROM "order" o
     WHERE o."createdAt" >= $1 AND o."createdAt" <= $2
       AND o."deletedAt" IS NULL
       AND o."taxAmount" > 0`,
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
    rows: (rows || []).map((r) => ({
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

async function generateOrderDetail(from: Date, to: Date, params: ReportParameters): Promise<ReportData> {
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

  const rows = (await query<Record<string, string>[]>(
    `SELECT
      o."orderId",
      o."orderNumber",
      o."status",
      o."createdAt",
      o."customerName",
      o."customerEmail",
      o."totalAmount",
      o."itemCount",
      o."shippingMethod",
      o."paymentMethod"
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

async function generatePaymentReport(from: Date, to: Date, _params: ReportParameters): Promise<ReportData> {
  const rows = (await query<Record<string, string>[]>(
    `SELECT
      p."paymentId",
      p."orderId",
      p."paymentMethod",
      p."gateway",
      p."amount",
      p."status",
      p."createdAt"
     FROM "payment" p
     WHERE p."createdAt" >= $1 AND p."createdAt" <= $2
     ORDER BY p."createdAt" DESC
     LIMIT 500`,
    [from, to],
  )) || [];

  const summary = await queryOne<Record<string, string>>(
    `SELECT
      COUNT(*) as "totalPayments",
      COALESCE(SUM(p."amount"), 0) as "totalAmount",
      COUNT(CASE WHEN p."status" = 'completed' THEN 1 END) as "completedPayments",
      COUNT(CASE WHEN p."status" = 'refunded' THEN 1 END) as "refundedPayments",
      COALESCE(SUM(CASE WHEN p."status" = 'refunded' THEN p."amount" ELSE 0 END), 0) as "refundedAmount"
     FROM "payment" p
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

async function generateFulfillmentReport(from: Date, to: Date, _params: ReportParameters): Promise<ReportData> {
  const rows = (await query<Record<string, string>[]>(
    `SELECT
      f."fulfillmentId",
      f."orderId",
      f."status",
      f."carrier",
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
