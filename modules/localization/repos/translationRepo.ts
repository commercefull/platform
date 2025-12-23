/**
 * Translation Repository
 * Handles CRUD operations for translations across different entity types
 */

import { query, queryOne } from '../../../libs/db';
import { Translation, TranslatableEntityType } from '../domain/entities/Translation';

// Table mapping for different entity types
const TABLE_MAP: Record<TranslatableEntityType, string> = {
  product: 'productTranslation',
  category: 'categoryTranslation',
  collection: 'collectionTranslation',
  brand: 'brandTranslation',
  contentPage: 'contentPageTranslation',
  notificationTemplate: 'notificationTemplateTranslation',
  attribute: 'attributeTranslation',
  attributeOption: 'attributeOptionTranslation',
};

// Primary key mapping
const PK_MAP: Record<TranslatableEntityType, string> = {
  product: 'productTranslationId',
  category: 'categoryTranslationId',
  collection: 'collectionTranslationId',
  brand: 'brandTranslationId',
  contentPage: 'contentPageTranslationId',
  notificationTemplate: 'notificationTemplateTranslationId',
  attribute: 'attributeTranslationId',
  attributeOption: 'attributeOptionTranslationId',
};

// Entity ID column mapping
const ENTITY_ID_MAP: Record<TranslatableEntityType, string> = {
  product: 'productId',
  category: 'productCategoryId',
  collection: 'productCollectionId',
  brand: 'productBrandId',
  contentPage: 'contentPageId',
  notificationTemplate: 'notificationTemplateId',
  attribute: 'productAttributeId',
  attributeOption: 'productAttributeOptionId',
};

export interface TranslationFilters {
  entityType?: TranslatableEntityType;
  entityId?: string;
  localeId?: string;
  localeCode?: string;
  isApproved?: boolean;
  isAutoTranslated?: boolean;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// Product Translation Repository
// ============================================================================

export async function getProductTranslation(productId: string, localeId: string): Promise<Record<string, any> | null> {
  const row = await queryOne<Record<string, any>>(
    `SELECT pt.*, l.code as "localeCode" 
     FROM "productTranslation" pt
     JOIN locale l ON l."localeId" = pt."localeId"
     WHERE pt."productId" = $1 AND pt."localeId" = $2`,
    [productId, localeId],
  );
  return row;
}

export async function getProductTranslations(productId: string): Promise<Record<string, any>[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT pt.*, l.code as "localeCode", l.name as "localeName"
     FROM "productTranslation" pt
     JOIN locale l ON l."localeId" = pt."localeId"
     WHERE pt."productId" = $1
     ORDER BY l."isDefault" DESC, l.code ASC`,
    [productId],
  );
  return rows || [];
}

export async function saveProductTranslation(data: {
  productId: string;
  localeId: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  returnPolicy?: string;
  warranty?: string;
  careInstructions?: string;
  ingredients?: string;
  usageInstructions?: string;
  customFields?: Record<string, any>;
  isAutoTranslated?: boolean;
  translationSource?: string;
  translationQuality?: number;
}): Promise<Record<string, any>> {
  const now = new Date().toISOString();

  const existing = await queryOne<Record<string, any>>(
    'SELECT "productTranslationId" FROM "productTranslation" WHERE "productId" = $1 AND "localeId" = $2',
    [data.productId, data.localeId],
  );

  if (existing) {
    await query(
      `UPDATE "productTranslation" SET
        name = $1, slug = $2, "shortDescription" = $3, description = $4,
        "metaTitle" = $5, "metaDescription" = $6, "metaKeywords" = $7,
        "returnPolicy" = $8, warranty = $9, "careInstructions" = $10,
        ingredients = $11, "usageInstructions" = $12, "customFields" = $13,
        "isAutoTranslated" = $14, "translationSource" = $15, "translationQuality" = $16,
        "updatedAt" = $17
      WHERE "productTranslationId" = $18`,
      [
        data.name,
        data.slug,
        data.shortDescription,
        data.description,
        data.metaTitle,
        data.metaDescription,
        data.metaKeywords,
        data.returnPolicy,
        data.warranty,
        data.careInstructions,
        data.ingredients,
        data.usageInstructions,
        data.customFields ? JSON.stringify(data.customFields) : null,
        data.isAutoTranslated || false,
        data.translationSource || 'manual',
        data.translationQuality,
        now,
        existing.productTranslationId,
      ],
    );
    return { ...data, productTranslationId: existing.productTranslationId };
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "productTranslation" (
        "productId", "localeId", name, slug, "shortDescription", description,
        "metaTitle", "metaDescription", "metaKeywords",
        "returnPolicy", warranty, "careInstructions", ingredients, "usageInstructions",
        "customFields", "isAutoTranslated", "translationSource", "translationQuality",
        "isApproved", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        data.productId,
        data.localeId,
        data.name,
        data.slug,
        data.shortDescription,
        data.description,
        data.metaTitle,
        data.metaDescription,
        data.metaKeywords,
        data.returnPolicy,
        data.warranty,
        data.careInstructions,
        data.ingredients,
        data.usageInstructions,
        data.customFields ? JSON.stringify(data.customFields) : null,
        data.isAutoTranslated || false,
        data.translationSource || 'manual',
        data.translationQuality,
        false,
        now,
        now,
      ],
    );
    return result || data;
  }
}

export async function deleteProductTranslation(productId: string, localeId: string): Promise<void> {
  await query('DELETE FROM "productTranslation" WHERE "productId" = $1 AND "localeId" = $2', [productId, localeId]);
}

export async function approveProductTranslation(productId: string, localeId: string, reviewerId: string): Promise<void> {
  await query(
    `UPDATE "productTranslation" SET 
      "isApproved" = true, "reviewedAt" = $1, "reviewedBy" = $2, "updatedAt" = $1
     WHERE "productId" = $3 AND "localeId" = $4`,
    [new Date().toISOString(), reviewerId, productId, localeId],
  );
}

// ============================================================================
// Category Translation Repository
// ============================================================================

export async function getCategoryTranslation(categoryId: string, localeId: string): Promise<Record<string, any> | null> {
  const row = await queryOne<Record<string, any>>(
    `SELECT ct.*, l.code as "localeCode"
     FROM "categoryTranslation" ct
     JOIN locale l ON l."localeId" = ct."localeId"
     WHERE ct."productCategoryId" = $1 AND ct."localeId" = $2`,
    [categoryId, localeId],
  );
  return row;
}

export async function getCategoryTranslations(categoryId: string): Promise<Record<string, any>[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT ct.*, l.code as "localeCode", l.name as "localeName"
     FROM "categoryTranslation" ct
     JOIN locale l ON l."localeId" = ct."localeId"
     WHERE ct."productCategoryId" = $1
     ORDER BY l."isDefault" DESC, l.code ASC`,
    [categoryId],
  );
  return rows || [];
}

export async function saveCategoryTranslation(data: {
  productCategoryId: string;
  localeId: string;
  name: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isAutoTranslated?: boolean;
  translationSource?: string;
}): Promise<Record<string, any>> {
  const now = new Date().toISOString();

  const existing = await queryOne<Record<string, any>>(
    'SELECT "categoryTranslationId" FROM "categoryTranslation" WHERE "productCategoryId" = $1 AND "localeId" = $2',
    [data.productCategoryId, data.localeId],
  );

  if (existing) {
    await query(
      `UPDATE "categoryTranslation" SET
        name = $1, slug = $2, description = $3,
        "metaTitle" = $4, "metaDescription" = $5, "metaKeywords" = $6,
        "isAutoTranslated" = $7, "translationSource" = $8, "updatedAt" = $9
      WHERE "categoryTranslationId" = $10`,
      [
        data.name,
        data.slug,
        data.description,
        data.metaTitle,
        data.metaDescription,
        data.metaKeywords,
        data.isAutoTranslated || false,
        data.translationSource || 'manual',
        now,
        existing.categoryTranslationId,
      ],
    );
    return { ...data, categoryTranslationId: existing.categoryTranslationId };
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "categoryTranslation" (
        "productCategoryId", "localeId", name, slug, description,
        "metaTitle", "metaDescription", "metaKeywords",
        "isAutoTranslated", "translationSource", "isApproved",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.productCategoryId,
        data.localeId,
        data.name,
        data.slug,
        data.description,
        data.metaTitle,
        data.metaDescription,
        data.metaKeywords,
        data.isAutoTranslated || false,
        data.translationSource || 'manual',
        false,
        now,
        now,
      ],
    );
    return result || data;
  }
}

// ============================================================================
// Generic Translation Functions
// ============================================================================

/**
 * Get all translations for an entity
 */
export async function getEntityTranslations(entityType: TranslatableEntityType, entityId: string): Promise<Record<string, any>[]> {
  const table = TABLE_MAP[entityType];
  const entityIdCol = ENTITY_ID_MAP[entityType];

  const rows = await query<Record<string, any>[]>(
    `SELECT t.*, l.code as "localeCode", l.name as "localeName"
     FROM "${table}" t
     JOIN locale l ON l."localeId" = t."localeId"
     WHERE t."${entityIdCol}" = $1
     ORDER BY l."isDefault" DESC, l.code ASC`,
    [entityId],
  );
  return rows || [];
}

/**
 * Get translation for a specific locale
 */
export async function getEntityTranslation(
  entityType: TranslatableEntityType,
  entityId: string,
  localeId: string,
): Promise<Record<string, any> | null> {
  const table = TABLE_MAP[entityType];
  const entityIdCol = ENTITY_ID_MAP[entityType];

  const row = await queryOne<Record<string, any>>(
    `SELECT t.*, l.code as "localeCode"
     FROM "${table}" t
     JOIN locale l ON l."localeId" = t."localeId"
     WHERE t."${entityIdCol}" = $1 AND t."localeId" = $2`,
    [entityId, localeId],
  );
  return row;
}

/**
 * Get missing translations for an entity
 */
export async function getMissingTranslations(entityType: TranslatableEntityType, entityId: string): Promise<Record<string, any>[]> {
  const table = TABLE_MAP[entityType];
  const entityIdCol = ENTITY_ID_MAP[entityType];

  const rows = await query<Record<string, any>[]>(
    `SELECT l."localeId", l.code, l.name
     FROM locale l
     WHERE l."isActive" = true
     AND l."localeId" NOT IN (
       SELECT "localeId" FROM "${table}" WHERE "${entityIdCol}" = $1
     )
     ORDER BY l."isDefault" DESC, l.code ASC`,
    [entityId],
  );
  return rows || [];
}

/**
 * Get translation statistics
 */
export async function getTranslationStatistics(): Promise<
  {
    entityType: string;
    total: number;
    approved: number;
    autoTranslated: number;
    pending: number;
  }[]
> {
  const results: any[] = [];

  for (const [entityType, table] of Object.entries(TABLE_MAP)) {
    const stats = await queryOne<Record<string, string>>(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "isApproved" = true) as approved,
        COUNT(*) FILTER (WHERE "isAutoTranslated" = true) as "autoTranslated",
        COUNT(*) FILTER (WHERE "isApproved" = false) as pending
      FROM "${table}"
    `);

    results.push({
      entityType,
      total: parseInt(stats?.total || '0', 10),
      approved: parseInt(stats?.approved || '0', 10),
      autoTranslated: parseInt(stats?.autoTranslated || '0', 10),
      pending: parseInt(stats?.pending || '0', 10),
    });
  }

  return results;
}

/**
 * Bulk approve translations
 */
export async function bulkApproveTranslations(
  entityType: TranslatableEntityType,
  translationIds: string[],
  reviewerId: string,
): Promise<number> {
  const table = TABLE_MAP[entityType];
  const pk = PK_MAP[entityType];

  const result = await query(
    `UPDATE "${table}" SET 
      "isApproved" = true, "reviewedAt" = $1, "reviewedBy" = $2, "updatedAt" = $1
     WHERE "${pk}" = ANY($3::uuid[])`,
    [new Date().toISOString(), reviewerId, translationIds],
  );

  return (result as any)?.rowCount || 0;
}
