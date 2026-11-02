/**
 * orderItem table queries.
 */

import { query, queryOne } from '../../../../libs/db';
import { OrderItem } from '../../domain/entities/OrderItem';
import type { OrderItem as DbOrderItem } from '../../../../libs/db/types';
import { mapToOrderItem } from './orderRowMappers';

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const rows = await query<DbOrderItem[]>('SELECT * FROM "orderItem" WHERE "orderId" = $1 ORDER BY "createdAt" ASC', [orderId]);
  const order = await queryOne<{ currencyCode: string }>('SELECT "currencyCode" FROM "order" WHERE "orderId" = $1', [orderId]);
  const currency = order?.currencyCode || 'USD';
  return (rows || []).map(row => mapToOrderItem(row, currency));
}

export async function findOrderItemById(orderItemId: string): Promise<OrderItem | null> {
  const row = await queryOne<DbOrderItem>('SELECT * FROM "orderItem" WHERE "orderItemId" = $1', [orderItemId]);
  if (!row) return null;
  const order = await queryOne<{ currencyCode: string }>('SELECT "currencyCode" FROM "order" WHERE "orderId" = $1', [row.orderId]);
  return mapToOrderItem(row, order?.currencyCode || 'USD');
}

export async function addOrderItem(orderId: string, item: OrderItem): Promise<OrderItem> {
  const now = new Date().toISOString();
  await query(
    `INSERT INTO "orderItem" (
      "orderItemId", "orderId", "productId", "productVariantId", "sku", "name",
      "description", "quantity", "unitPriceCents", "unitCostCents", "discountedUnitPriceCents",
      "lineTotalCents", "discountTotalCents", "taxTotalCents", "taxRate", "taxExempt",
      "fulfillmentStatus", "options", "attributes", "giftWrapped", "giftMessage",
      "weight", "dimensions", "isDigital", "subscriptionInfo", "metadata",
      "createdAt", "updatedAt"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)`,
    [
      item.orderItemId,
      orderId,
      item.productId,
      item.productVariantId || null,
      item.sku,
      item.name,
      item.description || null,
      item.quantity,
      item.unitPrice.cents,
      item.unitCost?.cents ?? null,
      item.discountedUnitPrice?.cents ?? null,
      item.lineTotal.cents,
      item.discountTotal.cents,
      item.taxTotal.cents,
      item.taxRate || null,
      item.taxExempt,
      item.fulfillmentStatus,
      item.options ? JSON.stringify(item.options) : null,
      item.attributes ? JSON.stringify(item.attributes) : null,
      item.giftWrapped,
      item.giftMessage || null,
      item.weight || null,
      item.dimensions ? JSON.stringify(item.dimensions) : null,
      item.isDigital,
      item.subscriptionInfo ? JSON.stringify(item.subscriptionInfo) : null,
      item.metadata ? JSON.stringify(item.metadata) : null,
      now,
      now,
    ],
  );
  return item;
}

export async function updateOrderItem(item: OrderItem): Promise<OrderItem> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "orderItem" SET
      "quantity" = $1, "unitPriceCents" = $2, "discountedUnitPriceCents" = $3,
      "lineTotalCents" = $4, "discountTotalCents" = $5, "taxTotalCents" = $6,
      "fulfillmentStatus" = $7, "giftWrapped" = $8, "giftMessage" = $9,
      "updatedAt" = $10
    WHERE "orderItemId" = $11`,
    [
      item.quantity,
      item.unitPrice.cents,
      item.discountedUnitPrice?.cents ?? null,
      item.lineTotal.cents,
      item.discountTotal.cents,
      item.taxTotal.cents,
      item.fulfillmentStatus,
      item.giftWrapped,
      item.giftMessage || null,
      now,
      item.orderItemId,
    ],
  );
  return item;
}

export async function removeOrderItem(orderItemId: string): Promise<void> {
  await query('DELETE FROM "orderItem" WHERE "orderItemId" = $1', [orderItemId]);
}
