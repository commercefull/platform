/**
 * Bundle Repository
 * Handles CRUD operations for product bundles
 */

import { query, queryOne } from '../../../../libs/db';
import { ProductBundle as DbProductBundle, ProductBundleItem as DbProductBundleItem } from '../../../../libs/db/types';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';
import { ProductPricingAdapter } from '../acl/ProductPricingAdapter';

// ============================================================================
// Types
// ============================================================================

export type BundleType = 'fixed' | 'customizable' | 'mix_and_match';
export type PricingType = 'fixed' | 'calculated' | 'percentage_discount';

export type ProductBundle = DbProductBundle;

export type BundleItem = DbProductBundleItem;

// ============================================================================
// Product Bundles
// ============================================================================

export async function getBundle(productBundleId: string): Promise<ProductBundle | null> {
  const row = await queryOne<DbProductBundle>('SELECT * FROM "productBundle" WHERE "productBundleId" = $1', [productBundleId]);
  return row ? mapToBundle(row) : null;
}

export async function getBundleByProductId(productId: string): Promise<ProductBundle | null> {
  const row = await queryOne<DbProductBundle>('SELECT * FROM "productBundle" WHERE "productId" = $1', [productId]);
  return row ? mapToBundle(row) : null;
}

export async function getBundles(
  filters?: { bundleType?: BundleType; isActive?: boolean },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: ProductBundle[]; total: number }> {
  let whereClause = '1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.bundleType) {
    whereClause += ` AND "bundleType" = $${paramIndex++}`;
    params.push(filters.bundleType);
  }
  if (filters?.isActive !== undefined) {
    whereClause += ` AND "isActive" = $${paramIndex++}`;
    params.push(filters.isActive);
  }

  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "productBundle" WHERE ${whereClause}`, params);

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<DbProductBundle[]>(
    `SELECT * FROM "productBundle" WHERE ${whereClause} 
     ORDER BY "sortOrder" ASC, "createdAt" DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToBundle),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function getActiveBundles(): Promise<ProductBundle[]> {
  const now = new Date().toISOString();
  const rows = await query<DbProductBundle[]>(
    `SELECT * FROM "productBundle" 
     WHERE "isActive" = true 
     AND ("startDate" IS NULL OR "startDate" <= $1)
     AND ("endDate" IS NULL OR "endDate" >= $1)
     ORDER BY "sortOrder" ASC`,
    [now],
  );
  return (rows || []).map(mapToBundle);
}

export async function saveBundle(
  bundle: Partial<ProductBundle> & {
    productId: string;
    name: string;
  },
): Promise<ProductBundle> {
  const now = new Date().toISOString();
  const slug = bundle.slug || bundle.name.toLowerCase().replace(/\s+/g, '-');

  if (bundle.productBundleId) {
    await query(
      `UPDATE "productBundle" SET
        "name" = $1, "slug" = $2, "description" = $3, "bundleType" = $4,
        "pricingType" = $5, "fixedPriceCents" = $6, "discountPercent" = $7,
        "discountAmountCents" = $8, "minPriceCents" = $9, "maxPriceCents" = $10, "currencyCode" = $11,
        "minItems" = $12, "maxItems" = $13, "minQuantity" = $14, "maxQuantity" = $15,
        "requireAllItems" = $16, "allowDuplicates" = $17, "showSavings" = $18,
        "savingsAmountCents" = $19, "savingsPercent" = $20, "imageUrl" = $21,
        "sortOrder" = $22, "isActive" = $23, "startDate" = $24, "endDate" = $25,
        "metadata" = $26, "updatedAt" = $27
      WHERE "productBundleId" = $28`,
      [
        bundle.name,
        slug,
        bundle.description,
        bundle.bundleType || 'fixed',
        bundle.pricingType || 'fixed',
        bundle.fixedPriceCents,
        bundle.discountPercent,
        bundle.discountAmountCents,
        bundle.minPriceCents,
        bundle.maxPriceCents,
        bundle.currencyCode || 'USD',
        bundle.minItems,
        bundle.maxItems,
        bundle.minQuantity || 1,
        bundle.maxQuantity,
        bundle.requireAllItems !== false,
        bundle.allowDuplicates || false,
        bundle.showSavings !== false,
        bundle.savingsAmountCents,
        bundle.savingsPercent,
        bundle.imageUrl,
        bundle.sortOrder || 0,
        bundle.isActive !== false,
        bundle.startDate?.toISOString(),
        bundle.endDate?.toISOString(),
        bundle.metadata ? JSON.stringify(bundle.metadata) : null,
        now,
        bundle.productBundleId,
      ],
    );
    return (await getBundle(bundle.productBundleId))!;
  } else {
    const result = await queryOne<DbProductBundle>(
      `INSERT INTO "productBundle" (
        "productId", "name", "slug", "description", "bundleType", "pricingType",
        "fixedPriceCents", "discountPercent", "discountAmountCents", "minPriceCents", "maxPriceCents",
        "currencyCode", "minItems", "maxItems", "minQuantity", "maxQuantity",
        "requireAllItems", "allowDuplicates", "showSavings", "savingsAmountCents",
        "savingsPercent", "imageUrl", "sortOrder", "isActive", "startDate", "endDate",
        "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *`,
      [
        bundle.productId,
        bundle.name,
        slug,
        bundle.description,
        bundle.bundleType || 'fixed',
        bundle.pricingType || 'fixed',
        bundle.fixedPriceCents,
        bundle.discountPercent,
        bundle.discountAmountCents,
        bundle.minPriceCents,
        bundle.maxPriceCents,
        bundle.currencyCode || 'USD',
        bundle.minItems,
        bundle.maxItems,
        bundle.minQuantity || 1,
        bundle.maxQuantity,
        bundle.requireAllItems !== false,
        bundle.allowDuplicates || false,
        bundle.showSavings !== false,
        bundle.savingsAmountCents,
        bundle.savingsPercent,
        bundle.imageUrl,
        bundle.sortOrder || 0,
        true,
        bundle.startDate?.toISOString(),
        bundle.endDate?.toISOString(),
        bundle.metadata ? JSON.stringify(bundle.metadata) : null,
        now,
        now,
      ],
    );
    return mapToBundle(result!);
  }
}

export async function deleteBundle(productBundleId: string): Promise<void> {
  await query('DELETE FROM "productBundleItem" WHERE "productBundleId" = $1', [productBundleId]);
  await query('DELETE FROM "productBundle" WHERE "productBundleId" = $1', [productBundleId]);
}

// ============================================================================
// Bundle Items
// ============================================================================

export async function getBundleItem(bundleItemId: string): Promise<BundleItem | null> {
  const row = await queryOne<DbProductBundleItem>('SELECT * FROM "productBundleItem" WHERE "bundleItemId" = $1', [bundleItemId]);
  return row ? mapToBundleItem(row) : null;
}

export async function getBundleItems(productBundleId: string): Promise<BundleItem[]> {
  const rows = await query<DbProductBundleItem[]>(
    'SELECT * FROM "productBundleItem" WHERE "productBundleId" = $1 ORDER BY "sortOrder" ASC',
    [productBundleId],
  );
  return (rows || []).map(mapToBundleItem);
}

export async function saveBundleItem(
  item: Partial<BundleItem> & {
    productBundleId: string;
    productId: string;
  },
): Promise<BundleItem> {
  const now = new Date().toISOString();

  if (item.bundleItemId) {
    await query(
      `UPDATE "productBundleItem" SET
        "productId" = $1, "productVariantId" = $2, "slotName" = $3,
        "quantity" = $4, "minQuantity" = $5, "maxQuantity" = $6,
        "isRequired" = $7, "isDefault" = $8, "priceAdjustmentCents" = $9,
        "discountPercent" = $10, "sortOrder" = $11, "metadata" = $12, "updatedAt" = $13
      WHERE "bundleItemId" = $14`,
      [
        item.productId,
        item.productVariantId,
        item.slotName,
        item.quantity || 1,
        item.minQuantity || 1,
        item.maxQuantity,
        item.isRequired !== false,
        item.isDefault || false,
        item.priceAdjustmentCents || 0,
        item.discountPercent || null,
        item.sortOrder || 0,
        item.metadata ? JSON.stringify(item.metadata) : null,
        now,
        item.bundleItemId,
      ],
    );
    return (await getBundleItem(item.bundleItemId))!;
  } else {
    const result = await queryOne<DbProductBundleItem>(
      `INSERT INTO "productBundleItem" (
        "productBundleId", "productId", "productVariantId", "slotName",
        "quantity", "minQuantity", "maxQuantity", "isRequired", "isDefault",
        "priceAdjustmentCents", "discountPercent", "sortOrder", "metadata",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        item.productBundleId,
        item.productId,
        item.productVariantId,
        item.slotName,
        item.quantity || 1,
        item.minQuantity || 1,
        item.maxQuantity,
        item.isRequired !== false,
        item.isDefault || false,
        item.priceAdjustmentCents || 0,
        item.discountPercent || null,
        item.sortOrder || 0,
        item.metadata ? JSON.stringify(item.metadata) : null,
        now,
        now,
      ],
    );
    return mapToBundleItem(result!);
  }
}

export async function deleteBundleItem(bundleItemId: string): Promise<void> {
  await query('DELETE FROM "productBundleItem" WHERE "bundleItemId" = $1', [bundleItemId]);
}

// ============================================================================
// Bundle Pricing
// ============================================================================

const productPricingPort = new ProductPricingAdapter();

/** Effective catalog price in integer cents, resolved from the pricing-owned store. */
async function getProductPriceCents(productId: string, productVariantId?: string): Promise<number> {
  const price = await productPricingPort.getBasePrice(productId, productVariantId);
  if (!price) return 0;
  return price.salePriceCents ?? price.priceCents;
}

/** Legacy decimal (major-unit) columns on bundle tables, converted to cents at the boundary. */
function toCents(amount: number | null | undefined): number {
  return amount ? Math.round(amount * 100) : 0;
}

export async function calculateBundlePrice(
  productBundleId: string,
  selectedItems?: { productId: string; productVariantId?: string; quantity: number }[],
): Promise<{ priceCents: number; savingsCents: number; savingsPercent: number }> {
  const bundle = await getBundle(productBundleId);
  if (!bundle) throw new ProductNotFoundError(productBundleId);

  const items = await getBundleItems(productBundleId);

  if (bundle.pricingType === 'fixed' && bundle.fixedPriceCents) {
    const fixedPriceCents = toCents(bundle.fixedPriceCents);
    let individualTotalCents = 0;
    for (const item of items) {
      const itemPriceCents = await getProductPriceCents(item.productId, item.productVariantId ?? undefined);
      individualTotalCents += itemPriceCents * (item.quantity ?? 1);
    }
    const savingsCents = individualTotalCents - fixedPriceCents;
    return {
      priceCents: fixedPriceCents,
      savingsCents: savingsCents > 0 ? savingsCents : 0,
      savingsPercent: savingsCents > 0 ? (savingsCents / individualTotalCents) * 100 : 0,
    };
  }

  let totalCents = 0;
  let originalTotalCents = 0;

  for (const item of items) {
    const itemPriceCents = await getProductPriceCents(item.productId, item.productVariantId ?? undefined);
    const quantity = selectedItems?.find(s => s.productId === item.productId)?.quantity ?? item.quantity ?? 1;
    const discountedPriceCents =
      Math.round(itemPriceCents * (1 - Number(item.discountPercent || 0) / 100)) + toCents(item.priceAdjustmentCents);

    totalCents += discountedPriceCents * quantity;
    originalTotalCents += itemPriceCents * quantity;
  }

  if (bundle.discountPercent) {
    totalCents = Math.round(totalCents * (1 - Number(bundle.discountPercent) / 100));
  }
  if (bundle.discountAmountCents) {
    totalCents = totalCents - toCents(bundle.discountAmountCents);
  }

  const maxPriceCents = toCents(bundle.maxPriceCents);
  if (maxPriceCents && totalCents > maxPriceCents) totalCents = maxPriceCents;

  const savingsCents = originalTotalCents - totalCents;
  return {
    priceCents: Math.max(totalCents, toCents(bundle.minPriceCents)),
    savingsCents: savingsCents > 0 ? savingsCents : 0,
    savingsPercent: savingsCents > 0 ? (savingsCents / originalTotalCents) * 100 : 0,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function mapToBundle(row: DbProductBundle): ProductBundle {
  return row;
}

function mapToBundleItem(row: DbProductBundleItem): BundleItem {
  return row;
}
