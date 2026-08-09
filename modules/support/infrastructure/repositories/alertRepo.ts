/**
 * Alert Repository
 * Handles CRUD operations for stock and price alerts
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Table Constants
// ============================================================================

/* const _TABLE = {
  STOCK_ALERT: Table.InventoryStockAlert,
  PRICE_ALERT: Table.SupportPriceAlert,
}; */

// ============================================================================
// Types
// ============================================================================

export type AlertStatus = 'active' | 'notified' | 'purchased' | 'cancelled' | 'expired';
export type NotificationChannel = 'email' | 'sms' | 'push' | 'all';
export type PriceAlertType = 'target' | 'any_drop' | 'percentage_drop';

export interface StockAlert {
  stockAlertId: string;
  customerId?: string;
  email?: string;
  phone?: string;
  productId: string;
  productVariantId?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  status: AlertStatus;
  desiredQuantity: number;
  stockThreshold: number;
  notifyOnAnyStock: boolean;
  notificationChannel: NotificationChannel;
  notifiedAt?: Date;
  notificationCount: number;
  lastNotifiedAt?: Date;
  purchasedAt?: Date;
  purchaseOrderId?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceAlert {
  priceAlertId: string;
  customerId?: string;
  email?: string;
  phone?: string;
  productId: string;
  productVariantId?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  status: AlertStatus;
  alertType: PriceAlertType;
  targetPrice?: number;
  percentageDrop?: number;
  originalPrice?: number;
  currentPrice?: number;
  currency: string;
  notificationChannel: NotificationChannel;
  notifiedAt?: Date;
  notifiedPrice?: number;
  notificationCount: number;
  lastNotifiedAt?: Date;
  purchasedAt?: Date;
  purchaseOrderId?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Stock Alerts
// ============================================================================

export async function getStockAlert(stockAlertId: string): Promise<StockAlert | null> {
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM "inventoryStockAlert" WHERE "stockAlertId" = $1', [stockAlertId]);
  return row ? mapToStockAlert(row) : null;
}

export async function getStockAlerts(
  filters?: { customerId?: string; productId?: string; status?: AlertStatus },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: StockAlert[]; total: number }> {
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.customerId) {
    whereClause += ` AND "customerId" = $${paramIndex++}`;
    params.push(filters.customerId);
  }
  if (filters?.productId) {
    whereClause += ` AND "productId" = $${paramIndex++}`;
    params.push(filters.productId);
  }
  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }

  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "inventoryStockAlert" WHERE ${whereClause}`, params);

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, unknown>[]>(
    `SELECT * FROM "inventoryStockAlert" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToStockAlert),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function getActiveStockAlertsForProduct(productId: string, productVariantId?: string): Promise<StockAlert[]> {
  let whereClause = '"productId" = $1 AND "status" = \'active\'';
  const params: unknown[] = [productId];

  if (productVariantId) {
    whereClause += ' AND ("productVariantId" = $2 OR "productVariantId" IS NULL)';
    params.push(productVariantId);
  }

  const rows = await query<Record<string, unknown>[]>(`SELECT * FROM "inventoryStockAlert" WHERE ${whereClause}`, params);
  return (rows || []).map(mapToStockAlert);
}

export async function createStockAlert(alert: {
  customerId?: string;
  email?: string;
  phone?: string;
  productId: string;
  productVariantId?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  desiredQuantity?: number;
  stockThreshold?: number;
  notificationChannel?: NotificationChannel;
  expiresAt?: Date;
}): Promise<StockAlert> {
  const now = new Date().toISOString();
  const expiresAt = alert.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default

  const result = await queryOne<Record<string, unknown>>(
    `INSERT INTO "inventoryStockAlert" (
      "customerId", "email", "phone", "productId", "productVariantId",
      "productName", "variantName", "sku", "status", "desiredQuantity",
      "stockThreshold", "notifyOnAnyStock", "notificationChannel", "expiresAt",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      alert.customerId,
      alert.email,
      alert.phone,
      alert.productId,
      alert.productVariantId,
      alert.productName,
      alert.variantName,
      alert.sku,
      alert.desiredQuantity || 1,
      alert.stockThreshold || 1,
      true,
      alert.notificationChannel || 'email',
      expiresAt.toISOString(),
      now,
      now,
    ],
  );

  return mapToStockAlert(result!);
}

export async function notifyStockAlert(stockAlertId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "inventoryStockAlert" SET 
      "status" = 'notified', "notifiedAt" = $1, "lastNotifiedAt" = $1,
      "notificationCount" = "notificationCount" + 1, "updatedAt" = $1
     WHERE "stockAlertId" = $2`,
    [now, stockAlertId],
  );
}

export async function markStockAlertPurchased(stockAlertId: string, orderId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "inventoryStockAlert" SET 
      "status" = 'purchased', "purchasedAt" = $1, "purchaseOrderId" = $2, "updatedAt" = $1
     WHERE "stockAlertId" = $3`,
    [now, orderId, stockAlertId],
  );
}

export async function cancelStockAlert(stockAlertId: string): Promise<void> {
  await query(
    `UPDATE "inventoryStockAlert" SET "status" = 'cancelled', "updatedAt" = $1
     WHERE "stockAlertId" = $2`,
    [new Date().toISOString(), stockAlertId],
  );
}

export async function expireStockAlerts(): Promise<number> {
  const result = await query<{ rowCount: number }>(
    `UPDATE "inventoryStockAlert" SET "status" = 'expired', "updatedAt" = $1
     WHERE "status" = 'active' AND "expiresAt" < NOW()`,
    [new Date().toISOString()],
  );
  return (result as { rowCount: number } | null)?.rowCount || 0;
}

// ============================================================================
// Price Alerts
// ============================================================================

export async function getPriceAlert(priceAlertId: string): Promise<PriceAlert | null> {
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM "supportPriceAlert" WHERE "priceAlertId" = $1', [priceAlertId]);
  return row ? mapToPriceAlert(row) : null;
}

export async function getPriceAlerts(
  filters?: { customerId?: string; productId?: string; status?: AlertStatus },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: PriceAlert[]; total: number }> {
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.customerId) {
    whereClause += ` AND "customerId" = $${paramIndex++}`;
    params.push(filters.customerId);
  }
  if (filters?.productId) {
    whereClause += ` AND "productId" = $${paramIndex++}`;
    params.push(filters.productId);
  }
  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }

  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "supportPriceAlert" WHERE ${whereClause}`, params);

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, unknown>[]>(
    `SELECT * FROM "supportPriceAlert" WHERE ${whereClause} 
     ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToPriceAlert),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function getActivePriceAlertsForProduct(productId: string, productVariantId?: string): Promise<PriceAlert[]> {
  let whereClause = '"productId" = $1 AND "status" = \'active\'';
  const params: unknown[] = [productId];

  if (productVariantId) {
    whereClause += ' AND ("productVariantId" = $2 OR "productVariantId" IS NULL)';
    params.push(productVariantId);
  }

  const rows = await query<Record<string, unknown>[]>(`SELECT * FROM "supportPriceAlert" WHERE ${whereClause}`, params);
  return (rows || []).map(mapToPriceAlert);
}

export async function getPriceAlertsToNotify(productId: string, newPrice: number): Promise<PriceAlert[]> {
  const rows = await query<Record<string, unknown>[]>(
    `SELECT * FROM "supportPriceAlert" 
     WHERE "productId" = $1 AND "status" = 'active'
     AND (
       ("alertType" = 'target' AND "targetPrice" >= $2)
       OR ("alertType" = 'any_drop' AND "originalPrice" > $2)
       OR ("alertType" = 'percentage_drop' AND "originalPrice" * (1 - "percentageDrop" / 100) >= $2)
     )`,
    [productId, newPrice],
  );
  return (rows || []).map(mapToPriceAlert);
}

export async function createPriceAlert(alert: {
  customerId?: string;
  email?: string;
  phone?: string;
  productId: string;
  productVariantId?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  alertType?: PriceAlertType;
  targetPrice?: number;
  percentageDrop?: number;
  originalPrice?: number;
  currentPrice?: number;
  currency?: string;
  notificationChannel?: NotificationChannel;
  expiresAt?: Date;
}): Promise<PriceAlert> {
  const now = new Date().toISOString();
  const expiresAt = alert.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default

  const result = await queryOne<Record<string, unknown>>(
    `INSERT INTO "supportPriceAlert" (
      "customerId", "email", "phone", "productId", "productVariantId",
      "productName", "variantName", "sku", "status", "alertType",
      "targetPrice", "percentageDrop", "originalPrice", "currentPrice",
      "currency", "notificationChannel", "expiresAt", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      alert.customerId,
      alert.email,
      alert.phone,
      alert.productId,
      alert.productVariantId,
      alert.productName,
      alert.variantName,
      alert.sku,
      alert.alertType || 'target',
      alert.targetPrice,
      alert.percentageDrop,
      alert.originalPrice,
      alert.currentPrice,
      alert.currency || 'USD',
      alert.notificationChannel || 'email',
      expiresAt.toISOString(),
      now,
      now,
    ],
  );

  return mapToPriceAlert(result!);
}

export async function notifyPriceAlert(priceAlertId: string, notifiedPrice: number): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "supportPriceAlert" SET 
      "status" = 'notified', "notifiedAt" = $1, "lastNotifiedAt" = $1,
      "notifiedPrice" = $2, "notificationCount" = "notificationCount" + 1, "updatedAt" = $1
     WHERE "priceAlertId" = $3`,
    [now, notifiedPrice, priceAlertId],
  );
}

export async function markPriceAlertPurchased(priceAlertId: string, orderId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "supportPriceAlert" SET 
      "status" = 'purchased', "purchasedAt" = $1, "purchaseOrderId" = $2, "updatedAt" = $1
     WHERE "priceAlertId" = $3`,
    [now, orderId, priceAlertId],
  );
}

export async function cancelPriceAlert(priceAlertId: string): Promise<void> {
  await query(
    `UPDATE "supportPriceAlert" SET "status" = 'cancelled', "updatedAt" = $1
     WHERE "priceAlertId" = $2`,
    [new Date().toISOString(), priceAlertId],
  );
}

export async function updatePriceAlertCurrentPrice(productId: string, newPrice: number): Promise<void> {
  await query(
    `UPDATE "supportPriceAlert" SET "currentPrice" = $1, "updatedAt" = $2
     WHERE "productId" = $3 AND "status" = 'active'`,
    [newPrice, new Date().toISOString(), productId],
  );
}

export async function expirePriceAlerts(): Promise<number> {
  const result = await query<{ rowCount: number }>(
    `UPDATE "supportPriceAlert" SET "status" = 'expired', "updatedAt" = $1
     WHERE "status" = 'active' AND "expiresAt" < NOW()`,
    [new Date().toISOString()],
  );
  return (result as { rowCount: number } | null)?.rowCount || 0;
}

// ============================================================================
// Helpers
// ============================================================================

function mapToStockAlert(row: Record<string, unknown>): StockAlert {
  return {
    stockAlertId: row.stockAlertId as string,
    customerId: row.customerId as string | undefined,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    productId: row.productId as string,
    productVariantId: row.productVariantId as string | undefined,
    productName: row.productName as string | undefined,
    variantName: row.variantName as string | undefined,
    sku: row.sku as string | undefined,
    status: row.status as AlertStatus,
    desiredQuantity: parseInt(row.desiredQuantity as string) || 1,
    stockThreshold: parseInt(row.stockThreshold as string) || 1,
    notifyOnAnyStock: Boolean(row.notifyOnAnyStock),
    notificationChannel: row.notificationChannel as NotificationChannel,
    notifiedAt: row.notifiedAt ? new Date(row.notifiedAt as string) : undefined,
    notificationCount: parseInt(row.notificationCount as string) || 0,
    lastNotifiedAt: row.lastNotifiedAt ? new Date(row.lastNotifiedAt as string) : undefined,
    purchasedAt: row.purchasedAt ? new Date(row.purchasedAt as string) : undefined,
    purchaseOrderId: row.purchaseOrderId as string | undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt as string) : undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

function mapToPriceAlert(row: Record<string, unknown>): PriceAlert {
  return {
    priceAlertId: row.priceAlertId as string,
    customerId: row.customerId as string | undefined,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    productId: row.productId as string,
    productVariantId: row.productVariantId as string | undefined,
    productName: row.productName as string | undefined,
    variantName: row.variantName as string | undefined,
    sku: row.sku as string | undefined,
    status: row.status as AlertStatus,
    alertType: row.alertType as PriceAlertType,
    targetPrice: row.targetPrice ? parseFloat(row.targetPrice as string) : undefined,
    percentageDrop: row.percentageDrop ? parseFloat(row.percentageDrop as string) : undefined,
    originalPrice: row.originalPrice ? parseFloat(row.originalPrice as string) : undefined,
    currentPrice: row.currentPrice ? parseFloat(row.currentPrice as string) : undefined,
    currency: (row.currency as string) || 'USD',
    notificationChannel: row.notificationChannel as NotificationChannel,
    notifiedAt: row.notifiedAt ? new Date(row.notifiedAt as string) : undefined,
    notifiedPrice: row.notifiedPrice ? parseFloat(row.notifiedPrice as string) : undefined,
    notificationCount: parseInt(row.notificationCount as string) || 0,
    lastNotifiedAt: row.lastNotifiedAt ? new Date(row.lastNotifiedAt as string) : undefined,
    purchasedAt: row.purchasedAt ? new Date(row.purchasedAt as string) : undefined,
    purchaseOrderId: row.purchaseOrderId as string | undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt as string) : undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}
