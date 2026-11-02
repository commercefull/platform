/**
 * productVariant and productImage table queries.
 */

import { query, queryOne } from '../../../../libs/db';
import type { ProductVariant as DbProductVariant, ProductImage as DbProductImage } from '../../../../libs/db/types';
import type { ProductImage } from '../../domain/entities/Product';
import type { ProductVariant } from '../../domain/entities/ProductVariant';
import { mapToVariant } from './productRowMappers';

export async function findVariantsByProductId(productId: string): Promise<ProductVariant[]> {
  const rows = await query<DbProductVariant[]>('SELECT * FROM "productVariant" WHERE "productId" = $1 ORDER BY "position" ASC', [
    productId,
  ]);
  return (rows || []).map(row => mapToVariant(row));
}

export async function findVariantById(variantId: string): Promise<ProductVariant | null> {
  const row = await queryOne<DbProductVariant>('SELECT * FROM "productVariant" WHERE "productVariantId" = $1', [variantId]);
  return row ? mapToVariant(row) : null;
}

export async function findVariantBySku(sku: string): Promise<ProductVariant | null> {
  const row = await queryOne<DbProductVariant>('SELECT * FROM "productVariant" WHERE sku = $1', [sku]);
  return row ? mapToVariant(row) : null;
}

export async function saveVariant(variant: ProductVariant): Promise<ProductVariant> {
  const now = new Date().toISOString();

  const existing = await queryOne<DbProductVariant>('SELECT "productVariantId" FROM "productVariant" WHERE "productVariantId" = $1', [
    variant.variantId,
  ]);

  if (existing) {
    await query(
      `UPDATE "productVariant" SET
        sku = $1, name = $2,
        weight = $3, "isDefault" = $4, status = $5,
        "position" = $6, barcode = $7, "updatedAt" = $8
      WHERE "productVariantId" = $9`,
      [
        variant.sku,
        variant.name,
        variant.dimensions.weight,
        variant.isDefault,
        variant.isActive ? 'active' : 'inactive',
        variant.position,
        variant.barcode,
        now,
        variant.variantId,
      ],
    );
  } else {
    await query(
      `INSERT INTO "productVariant" (
        "productVariantId", "productId", sku, name,
        weight, "isDefault", status, position, barcode,
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        variant.variantId,
        variant.productId,
        variant.sku,
        variant.name,
        variant.dimensions.weight,
        variant.isDefault,
        variant.isActive ? 'active' : 'inactive',
        variant.position,
        variant.barcode,
        now,
        now,
      ],
    );
  }

  await query(`UPDATE "productVariant" SET "inventoryPolicy" = $1 WHERE "productVariantId" = $2`, [
    variant.inventoryPolicy,
    variant.variantId,
  ]);

  return variant;
}

export async function deleteVariant(variantId: string): Promise<void> {
  await query('DELETE FROM "productVariant" WHERE "productVariantId" = $1', [variantId]);
}

export async function getDefaultVariant(productId: string): Promise<ProductVariant | null> {
  const row = await queryOne<DbProductVariant>('SELECT * FROM "productVariant" WHERE "productId" = $1 AND "isDefault" = true', [
    productId,
  ]);
  return row ? mapToVariant(row) : null;
}

// Image methods
export async function getProductImages(productId: string): Promise<ProductImage[]> {
  const rows = await query<DbProductImage[]>('SELECT * FROM "productImage" WHERE "productId" = $1 ORDER BY position ASC', [productId]);
  return (rows || []).map(row => ({
    imageId: row.productImageId,
    url: row.url,
    altText: row.alt ?? undefined,
    position: row.position,
    isPrimary: Boolean(row.isPrimary),
  }));
}

export async function addProductImage(productId: string, image: ProductImage): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `INSERT INTO "productImage" ("productImageId", "productId", url, "alt", position, "isPrimary", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [image.imageId, productId, image.url, image.altText, image.position, image.isPrimary, now, now],
  );
}

export async function updateProductImage(imageId: string, updates: { altText?: string; position?: number; isPrimary?: boolean }): Promise<void> {
  const setClauses: string[] = ['"updatedAt" = $1'];
  const params: unknown[] = [new Date().toISOString()];
  let paramIndex = 2;

  if (updates.altText !== undefined) {
    setClauses.push(`"alt" = $${paramIndex++}`);
    params.push(updates.altText);
  }
  if (updates.position !== undefined) {
    setClauses.push(`position = $${paramIndex++}`);
    params.push(updates.position);
  }
  if (updates.isPrimary !== undefined) {
    setClauses.push(`"isPrimary" = $${paramIndex++}`);
    params.push(updates.isPrimary);
  }

  params.push(imageId);
  await query(`UPDATE "productImage" SET ${setClauses.join(', ')} WHERE "productImageId" = $${paramIndex}`, params);
}

export async function deleteProductImage(imageId: string): Promise<void> {
  await query('DELETE FROM "productImage" WHERE "productImageId" = $1', [imageId]);
}

export async function reorderProductImages(productId: string, imageIds: string[]): Promise<void> {
  for (let i = 0; i < imageIds.length; i++) {
    await query('UPDATE "productImage" SET position = $1, "updatedAt" = $2 WHERE "productImageId" = $3 AND "productId" = $4', [
      i,
      new Date().toISOString(),
      imageIds[i],
      productId,
    ]);
  }
}

