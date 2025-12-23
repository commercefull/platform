/**
 * Bundle Repository
 * Handles CRUD operations for product bundles
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type BundleType = 'fixed' | 'customizable' | 'mix_and_match';
export type PricingType = 'fixed' | 'calculated' | 'percentage_discount';

export interface ProductBundle {
  productBundleId: string;
  productId: string;
  name: string;
  slug?: string;
  description?: string;
  bundleType: BundleType;
  pricingType: PricingType;
  fixedPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  minPrice?: number;
  maxPrice?: number;
  currency: string;
  minItems?: number;
  maxItems?: number;
  minQuantity: number;
  maxQuantity?: number;
  requireAllItems: boolean;
  allowDuplicates: boolean;
  showSavings: boolean;
  savingsAmount?: number;
  savingsPercent?: number;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BundleItem {
  bundleItemId: string;
  productBundleId: string;
  productId: string;
  productVariantId?: string;
  slotName?: string;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  isRequired: boolean;
  isDefault: boolean;
  priceAdjustment: number;
  discountPercent: number;
  sortOrder: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Product Bundles
// ============================================================================

export async function getBundle(productBundleId: string): Promise<ProductBundle | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "productBundle" WHERE "productBundleId" = $1', [productBundleId]);
  return row ? mapToBundle(row) : null;
}

export async function getBundleByProductId(productId: string): Promise<ProductBundle | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "productBundle" WHERE "productId" = $1', [productId]);
  return row ? mapToBundle(row) : null;
}

export async function getBundles(
  filters?: { bundleType?: BundleType; isActive?: boolean },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: ProductBundle[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
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

  const rows = await query<Record<string, any>[]>(
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
  const rows = await query<Record<string, any>[]>(
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
        "pricingType" = $5, "fixedPrice" = $6, "discountPercent" = $7,
        "discountAmount" = $8, "minPrice" = $9, "maxPrice" = $10, "currency" = $11,
        "minItems" = $12, "maxItems" = $13, "minQuantity" = $14, "maxQuantity" = $15,
        "requireAllItems" = $16, "allowDuplicates" = $17, "showSavings" = $18,
        "savingsAmount" = $19, "savingsPercent" = $20, "imageUrl" = $21,
        "sortOrder" = $22, "isActive" = $23, "startDate" = $24, "endDate" = $25,
        "metadata" = $26, "updatedAt" = $27
      WHERE "productBundleId" = $28`,
      [
        bundle.name,
        slug,
        bundle.description,
        bundle.bundleType || 'fixed',
        bundle.pricingType || 'fixed',
        bundle.fixedPrice,
        bundle.discountPercent,
        bundle.discountAmount,
        bundle.minPrice,
        bundle.maxPrice,
        bundle.currency || 'USD',
        bundle.minItems,
        bundle.maxItems,
        bundle.minQuantity || 1,
        bundle.maxQuantity,
        bundle.requireAllItems !== false,
        bundle.allowDuplicates || false,
        bundle.showSavings !== false,
        bundle.savingsAmount,
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
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "productBundle" (
        "productId", "name", "slug", "description", "bundleType", "pricingType",
        "fixedPrice", "discountPercent", "discountAmount", "minPrice", "maxPrice",
        "currency", "minItems", "maxItems", "minQuantity", "maxQuantity",
        "requireAllItems", "allowDuplicates", "showSavings", "savingsAmount",
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
        bundle.fixedPrice,
        bundle.discountPercent,
        bundle.discountAmount,
        bundle.minPrice,
        bundle.maxPrice,
        bundle.currency || 'USD',
        bundle.minItems,
        bundle.maxItems,
        bundle.minQuantity || 1,
        bundle.maxQuantity,
        bundle.requireAllItems !== false,
        bundle.allowDuplicates || false,
        bundle.showSavings !== false,
        bundle.savingsAmount,
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
  await query('DELETE FROM "bundleItem" WHERE "productBundleId" = $1', [productBundleId]);
  await query('DELETE FROM "productBundle" WHERE "productBundleId" = $1', [productBundleId]);
}

// ============================================================================
// Bundle Items
// ============================================================================

export async function getBundleItem(bundleItemId: string): Promise<BundleItem | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "bundleItem" WHERE "bundleItemId" = $1', [bundleItemId]);
  return row ? mapToBundleItem(row) : null;
}

export async function getBundleItems(productBundleId: string): Promise<BundleItem[]> {
  const rows = await query<Record<string, any>[]>('SELECT * FROM "bundleItem" WHERE "productBundleId" = $1 ORDER BY "sortOrder" ASC', [
    productBundleId,
  ]);
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
      `UPDATE "bundleItem" SET
        "productId" = $1, "productVariantId" = $2, "slotName" = $3,
        "quantity" = $4, "minQuantity" = $5, "maxQuantity" = $6,
        "isRequired" = $7, "isDefault" = $8, "priceAdjustment" = $9,
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
        item.priceAdjustment || 0,
        item.discountPercent || 0,
        item.sortOrder || 0,
        item.metadata ? JSON.stringify(item.metadata) : null,
        now,
        item.bundleItemId,
      ],
    );
    return (await getBundleItem(item.bundleItemId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "bundleItem" (
        "productBundleId", "productId", "productVariantId", "slotName",
        "quantity", "minQuantity", "maxQuantity", "isRequired", "isDefault",
        "priceAdjustment", "discountPercent", "sortOrder", "metadata",
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
        item.priceAdjustment || 0,
        item.discountPercent || 0,
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
  await query('DELETE FROM "bundleItem" WHERE "bundleItemId" = $1', [bundleItemId]);
}

// ============================================================================
// Bundle Pricing
// ============================================================================

export async function calculateBundlePrice(
  productBundleId: string,
  selectedItems?: { productId: string; productVariantId?: string; quantity: number }[],
): Promise<{ price: number; savings: number; savingsPercent: number }> {
  const bundle = await getBundle(productBundleId);
  if (!bundle) throw new Error('Bundle not found');

  const items = await getBundleItems(productBundleId);

  if (bundle.pricingType === 'fixed' && bundle.fixedPrice) {
    // Calculate savings from individual prices
    let individualTotal = 0;
    for (const item of items) {
      // Would need to fetch product prices here
      individualTotal += item.quantity * 100; // Placeholder
    }
    const savings = individualTotal - bundle.fixedPrice;
    return {
      price: bundle.fixedPrice,
      savings: savings > 0 ? savings : 0,
      savingsPercent: savings > 0 ? (savings / individualTotal) * 100 : 0,
    };
  }

  // For calculated pricing, sum up item prices with discounts
  let total = 0;
  let originalTotal = 0;

  for (const item of items) {
    const itemPrice = 100; // Placeholder - would fetch actual price
    const quantity = selectedItems?.find(s => s.productId === item.productId)?.quantity || item.quantity;
    const discountedPrice = itemPrice * (1 - item.discountPercent / 100) + item.priceAdjustment;

    total += discountedPrice * quantity;
    originalTotal += itemPrice * quantity;
  }

  // Apply bundle-level discount
  if (bundle.discountPercent) {
    total = total * (1 - bundle.discountPercent / 100);
  }
  if (bundle.discountAmount) {
    total = total - bundle.discountAmount;
  }

  const savings = originalTotal - total;
  return {
    price: Math.max(total, bundle.minPrice || 0),
    savings: savings > 0 ? savings : 0,
    savingsPercent: savings > 0 ? (savings / originalTotal) * 100 : 0,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function mapToBundle(row: Record<string, any>): ProductBundle {
  return {
    productBundleId: row.productBundleId,
    productId: row.productId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    bundleType: row.bundleType,
    pricingType: row.pricingType,
    fixedPrice: row.fixedPrice ? parseFloat(row.fixedPrice) : undefined,
    discountPercent: row.discountPercent ? parseFloat(row.discountPercent) : undefined,
    discountAmount: row.discountAmount ? parseFloat(row.discountAmount) : undefined,
    minPrice: row.minPrice ? parseFloat(row.minPrice) : undefined,
    maxPrice: row.maxPrice ? parseFloat(row.maxPrice) : undefined,
    currency: row.currency || 'USD',
    minItems: row.minItems ? parseInt(row.minItems) : undefined,
    maxItems: row.maxItems ? parseInt(row.maxItems) : undefined,
    minQuantity: parseInt(row.minQuantity) || 1,
    maxQuantity: row.maxQuantity ? parseInt(row.maxQuantity) : undefined,
    requireAllItems: Boolean(row.requireAllItems),
    allowDuplicates: Boolean(row.allowDuplicates),
    showSavings: Boolean(row.showSavings),
    savingsAmount: row.savingsAmount ? parseFloat(row.savingsAmount) : undefined,
    savingsPercent: row.savingsPercent ? parseFloat(row.savingsPercent) : undefined,
    imageUrl: row.imageUrl,
    sortOrder: parseInt(row.sortOrder) || 0,
    isActive: Boolean(row.isActive),
    startDate: row.startDate ? new Date(row.startDate) : undefined,
    endDate: row.endDate ? new Date(row.endDate) : undefined,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function mapToBundleItem(row: Record<string, any>): BundleItem {
  return {
    bundleItemId: row.bundleItemId,
    productBundleId: row.productBundleId,
    productId: row.productId,
    productVariantId: row.productVariantId,
    slotName: row.slotName,
    quantity: parseInt(row.quantity) || 1,
    minQuantity: parseInt(row.minQuantity) || 1,
    maxQuantity: row.maxQuantity ? parseInt(row.maxQuantity) : undefined,
    isRequired: Boolean(row.isRequired),
    isDefault: Boolean(row.isDefault),
    priceAdjustment: parseFloat(row.priceAdjustment) || 0,
    discountPercent: parseFloat(row.discountPercent) || 0,
    sortOrder: parseInt(row.sortOrder) || 0,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
