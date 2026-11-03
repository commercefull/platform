/**
 * Report Data Provider
 *
 * Collaborates with the analytics module and other core modules
 * to gather data for report generation.
 */

import { query, queryOne } from '../../../../libs/db';
import type { ReportData, ReportType } from '../../domain/entities/ReportEntities';
import { UnknownReportTypeError } from '../../domain/errors/ReportingErrors';
import { generateTaxReport, generateOrderDetail, generatePaymentReport, generateFulfillmentReport } from './reportSecondaryReports';

export type { ReportParameters } from './reportParams';
import type { ReportParameters } from './reportParams';

export async function generateReport(reportType: ReportType, params: ReportParameters): Promise<ReportData> {
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

function salesOrderFilters(from: Date, to: Date, params: ReportParameters): { whereClause: string; values: unknown[] } {
  let whereClause = `WHERE o."createdAt" >= $1 AND o."createdAt" <= $2 AND o."deletedAt" IS NULL`;
  const values: unknown[] = [from, to];
  if (params.storeId) {
    whereClause += ` AND o."storeId" = $${values.length + 1}`;
    values.push(params.storeId);
  }
  return { whereClause, values };
}

function mapSalesSummary(summary: Record<string, string> | null): ReportData['summary'] {
  const num = (v: string | undefined): number => parseInt(v || '0');
  const amount = (v: string | undefined): number => parseFloat(v || '0');
  return {
    totalOrders: num(summary?.totalOrders),
    totalRevenue: amount(summary?.totalRevenue),
    averageOrderValue: amount(summary?.averageOrderValue),
    completedOrders: num(summary?.completedOrders),
    cancelledOrders: num(summary?.cancelledOrders),
    refundedOrders: num(summary?.refundedOrders),
    refundedAmount: amount(summary?.refundedAmount),
  };
}

async function generateSalesSummary(from: Date, to: Date, params: ReportParameters): Promise<ReportData> {
  const { whereClause, values } = salesOrderFilters(from, to, params);

  const summary = await queryOne<Record<string, string>>(
    `SELECT
      COUNT(*) as "totalOrders",
      COALESCE(SUM(o."totalAmountCents"), 0) / 100.0 as "totalRevenue",
      COALESCE(AVG(o."totalAmountCents"), 0) / 100.0 as "averageOrderValue",
      COUNT(CASE WHEN o."status" = 'completed' THEN 1 END) as "completedOrders",
      COUNT(CASE WHEN o."status" = 'cancelled' THEN 1 END) as "cancelledOrders",
      COUNT(CASE WHEN o."status" = 'refunded' THEN 1 END) as "refundedOrders",
      COALESCE(SUM(CASE WHEN o."status" = 'refunded' THEN o."totalAmountCents" ELSE 0 END), 0) / 100.0 as "refundedAmount"
     FROM "order" o ${whereClause}`,
    values,
  );

  const dailyRows =
    (await query<Record<string, string>[]>(
      `SELECT
      DATE(o."createdAt") as "date",
      COUNT(*) as "orderCount",
      COALESCE(SUM(o."totalAmountCents"), 0) / 100.0 as "revenue"
     FROM "order" o ${whereClause}
     GROUP BY DATE(o."createdAt")
     ORDER BY "date" ASC`,
      values,
    )) || [];

  return {
    reportType: 'sales_summary',
    generatedAt: new Date(),
    dateRange: { from, to },
    summary: mapSalesSummary(summary),
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
    whereClause += ` AND EXISTS (SELECT 1 FROM "productToCategory" ptc WHERE ptc."productId" = p."productId" AND ptc."productCategoryId" = $${idx++})`;
    values.push(params.categoryId);
  }

  const limit = params.limit || 50;

  const rows =
    (await query<Record<string, string>[]>(
      `SELECT
      oi."productId",
      p."name" as "productName",
      p."sku",
      SUM(oi."quantity") as "unitsSold",
      COALESCE(SUM(oi."quantity" * oi."unitPriceCents"), 0) / 100.0 as "revenue",
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
      COALESCE(SUM(oi."quantity" * oi."unitPriceCents"), 0) / 100.0 as "totalRevenue"
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

  const topCustomers =
    (await query<Record<string, string>[]>(
      `SELECT
      c."customerId",
      c."firstName",
      c."lastName",
      c."email",
      COUNT(o."orderId") as "orderCount",
      COALESCE(SUM(o."totalAmountCents"), 0) / 100.0 as "totalSpent"
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
  let whereClause = `WHERE 1 = 1`;
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

  const rows =
    (await query<Record<string, string>[]>(
      `SELECT
      i."inventoryLocationId" as "inventoryId",
      i."productId",
      p."name" as "productName",
      p."sku",
      i."quantity",
      i."reservedQuantity",
      i."minimumStockLevel",
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
