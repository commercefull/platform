/**
 * B2B Purchase Order Item Repository
 * Table: b2bPurchaseOrderItem
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export interface B2bPurchaseOrderItem {
  b2bPurchaseOrderItemId: string;
  b2bPurchaseOrderId: string;
  productId?: string;
  productVariantId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Functions
// ============================================================================

export async function findByPurchaseOrder(b2bPurchaseOrderId: string): Promise<B2bPurchaseOrderItem[]> {
  return (
    (await query<B2bPurchaseOrderItem[]>(
      `SELECT * FROM "b2bPurchaseOrderItem" WHERE "b2bPurchaseOrderId" = $1 ORDER BY "createdAt" ASC`,
      [b2bPurchaseOrderId],
    )) ?? []
  );
}

export async function create(data: {
  b2bPurchaseOrderId: string;
  productId?: string;
  productVariantId?: string;
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}): Promise<B2bPurchaseOrderItem> {
  const now = new Date().toISOString();
  const lineTotal = data.quantity * data.unitPrice;
  return queryOne<B2bPurchaseOrderItem>(
    `INSERT INTO "b2bPurchaseOrderItem"
       ("b2bPurchaseOrderId", "productId", "productVariantId", "sku", "name", "quantity", "unitPrice", "lineTotal", "notes", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
     RETURNING *`,
    [
      data.b2bPurchaseOrderId,
      data.productId ?? null,
      data.productVariantId ?? null,
      data.sku ?? null,
      data.name,
      data.quantity,
      data.unitPrice,
      lineTotal,
      data.notes ?? null,
      now,
    ],
  ) as Promise<B2bPurchaseOrderItem>;
}

export async function update(
  b2bPurchaseOrderItemId: string,
  data: { quantity?: number; unitPrice?: number; notes?: string },
): Promise<B2bPurchaseOrderItem | null> {
  const now = new Date().toISOString();
  return queryOne<B2bPurchaseOrderItem>(
    `UPDATE "b2bPurchaseOrderItem"
     SET "quantity"  = COALESCE($1, "quantity"),
         "unitPrice" = COALESCE($2, "unitPrice"),
         "lineTotal" = COALESCE($1, "quantity") * COALESCE($2, "unitPrice"),
         "notes"     = COALESCE($3, "notes"),
         "updatedAt" = $4
     WHERE "b2bPurchaseOrderItemId" = $5
     RETURNING *`,
    [data.quantity ?? null, data.unitPrice ?? null, data.notes ?? null, now, b2bPurchaseOrderItemId],
  );
}
