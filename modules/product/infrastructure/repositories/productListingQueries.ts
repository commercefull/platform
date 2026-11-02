/**
 * Listing / state-transition queries for productRepo (table `product`).
 */

import { query, queryOne } from '../../../../libs/db';
import type { Product as DbProduct } from '../../../../libs/db/types';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';
import { rowToProduct } from './productTableMappers';
import { ProductStatus, ProductVisibility } from './productTypes';
import type { Product } from './productTypes';

/**
 * Find new products
 */
export async function findNew(tableName: string, limit: number = 10): Promise<Product[]> {
  const sql = `
    SELECT * FROM "${tableName}"
    WHERE "isNew" = true
      AND "status" = $1
      AND "visibility" = $2
      AND "deletedAt" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT $3
  `;
  return ((await query<DbProduct[]>(sql, [ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || []).map(rowToProduct);
}

/**
 * Find bestseller products
 */
export async function findBestsellers(tableName: string, limit: number = 10): Promise<Product[]> {
  const sql = `
    SELECT * FROM "${tableName}"
    WHERE "isBestseller" = true
      AND "status" = $1
      AND "visibility" = $2
      AND "deletedAt" IS NULL
    ORDER BY "reviewCount" DESC, "averageRating" DESC
    LIMIT $3
  `;
  return ((await query<DbProduct[]>(sql, [ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || []).map(rowToProduct);
}

/**
 * Find related products
 */
export async function findRelated(
  tableName: string,
  findById: (id: string) => Promise<Product | null>,
  productId: string,
  limit: number = 10,
): Promise<Product[]> {
  const product = await findById(productId);
  if (!product) {
    return [];
  }

  // If product has explicit related products, use those
  if (product.relatedProducts && product.relatedProducts.length > 0) {
    const placeholders = product.relatedProducts.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `
      SELECT * FROM "${tableName}"
      WHERE "productId" IN (${placeholders})
        AND "status" = $${product.relatedProducts.length + 1}
        AND "visibility" = $${product.relatedProducts.length + 2}
        AND "deletedAt" IS NULL
      LIMIT $${product.relatedProducts.length + 3}
    `;
    return (
      (await query<DbProduct[]>(sql, [...product.relatedProducts, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || []
    ).map(rowToProduct);
  }

  // Otherwise, find products in the same category
  if (product.categoryId) {
    const sql = `
      SELECT * FROM "${tableName}"
      WHERE "categoryId" = $1
        AND "productId" != $2
        AND "status" = $3
        AND "visibility" = $4
        AND "deletedAt" IS NULL
      ORDER BY "isFeatured" DESC, RANDOM()
      LIMIT $5
    `;
    return (
      (await query<DbProduct[]>(sql, [product.categoryId, productId, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || []
    ).map(rowToProduct);
  }

  return [];
}

/**
 * Update product rating
 */
export async function updateRating(
  tableName: string,
  productId: string,
  averageRating: number,
  reviewCount: number,
): Promise<Product> {
  const sql = `
    UPDATE "${tableName}"
    SET "averageRating" = $2, "reviewCount" = $3, "updatedAt" = now()
    WHERE "productId" = $1 AND "deletedAt" IS NULL
    RETURNING *
  `;

  const result = await queryOne<DbProduct>(sql, [productId, averageRating, reviewCount]);

  if (!result) {
    throw new ProductNotFoundError(productId);
  }

  return rowToProduct(result);
}

/**
 * Publish a product
 */
export async function publish(tableName: string, id: string): Promise<Product> {
  const sql = `
    UPDATE "${tableName}"
    SET "status" = $2, "publishedAt" = now(), "updatedAt" = now()
    WHERE "productId" = $1 AND "deletedAt" IS NULL
    RETURNING *
  `;

  const result = await queryOne<DbProduct>(sql, [id, ProductStatus.ACTIVE]);

  if (!result) {
    throw new ProductNotFoundError(id);
  }

  return rowToProduct(result);
}
