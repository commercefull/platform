/**
 * Assortment Repository
 * 
 * Manages catalog visibility and product assortments scoped to stores, sellers, accounts, or channels.
 */

import { query, queryOne } from '../../../libs/db';
import { Assortment, AssortmentScope, AssortmentItem } from '../../../libs/db/dataModelTypes';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

// =============================================================================
// Assortment CRUD
// =============================================================================

export interface CreateAssortmentParams {
  organizationId: string;
  name: string;
  description?: string;
  scopeType: 'store' | 'seller' | 'account' | 'channel';
  isDefault?: boolean;
}

export async function createAssortment(params: CreateAssortmentParams): Promise<Assortment> {
  const assortmentId = generateId('asmt');
  const now = new Date();

  const sql = `
    INSERT INTO "assortment" (
      "assortmentId", "organizationId", "name", "description", "scopeType", "isDefault", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const result = await query<{ rows: Assortment[] }>(sql, [
    assortmentId,
    params.organizationId,
    params.name,
    params.description || null,
    params.scopeType,
    params.isDefault || false,
    now,
    now,
  ]);

  return result!.rows[0];
}

export async function findAssortmentById(assortmentId: string): Promise<Assortment | null> {
  return queryOne<Assortment>(
    'SELECT * FROM "assortment" WHERE "assortmentId" = $1 AND "deletedAt" IS NULL',
    [assortmentId]
  );
}

export async function findAssortmentsByOrganization(organizationId: string): Promise<Assortment[]> {
  const result = await query<{ rows: Assortment[] }>(
    'SELECT * FROM "assortment" WHERE "organizationId" = $1 AND "deletedAt" IS NULL ORDER BY "name" ASC',
    [organizationId]
  );
  return result?.rows ?? [];
}

export async function findDefaultAssortment(
  organizationId: string,
  scopeType: string
): Promise<Assortment | null> {
  return queryOne<Assortment>(
    'SELECT * FROM "assortment" WHERE "organizationId" = $1 AND "scopeType" = $2 AND "isDefault" = true AND "deletedAt" IS NULL',
    [organizationId, scopeType]
  );
}

// =============================================================================
// Assortment Scope
// =============================================================================

export interface CreateAssortmentScopeParams {
  assortmentId: string;
  storeId?: string;
  sellerId?: string;
  accountId?: string;
  channelId?: string;
}

export async function createAssortmentScope(params: CreateAssortmentScopeParams): Promise<AssortmentScope> {
  const assortmentScopeId = generateId('ascope');

  const sql = `
    INSERT INTO "assortmentScope" (
      "assortmentScopeId", "assortmentId", "storeId", "sellerId", "accountId", "channelId", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const result = await query<{ rows: AssortmentScope[] }>(sql, [
    assortmentScopeId,
    params.assortmentId,
    params.storeId || null,
    params.sellerId || null,
    params.accountId || null,
    params.channelId || null,
    new Date(),
  ]);

  return result!.rows[0];
}

export async function findAssortmentsByStore(storeId: string): Promise<Assortment[]> {
  const sql = `
    SELECT a.* FROM "assortment" a
    JOIN "assortmentScope" s ON s."assortmentId" = a."assortmentId"
    WHERE s."storeId" = $1 AND a."deletedAt" IS NULL
    ORDER BY a."name" ASC
  `;
  const result = await query<{ rows: Assortment[] }>(sql, [storeId]);
  return result?.rows ?? [];
}

export async function findAssortmentsBySeller(sellerId: string): Promise<Assortment[]> {
  const sql = `
    SELECT a.* FROM "assortment" a
    JOIN "assortmentScope" s ON s."assortmentId" = a."assortmentId"
    WHERE s."sellerId" = $1 AND a."deletedAt" IS NULL
    ORDER BY a."name" ASC
  `;
  const result = await query<{ rows: Assortment[] }>(sql, [sellerId]);
  return result?.rows ?? [];
}

// =============================================================================
// Assortment Items
// =============================================================================

export interface AddAssortmentItemParams {
  assortmentId: string;
  productVariantId: string;
  visibility?: 'listed' | 'hidden';
  buyable?: boolean;
  minQty?: number;
  maxQty?: number;
  incrementQty?: number;
  leadTimeDays?: number;
  discontinueDate?: Date;
  sortOrder?: number;
}

export async function addAssortmentItem(params: AddAssortmentItemParams): Promise<AssortmentItem> {
  const assortmentItemId = generateId('aitem');
  const now = new Date();

  const sql = `
    INSERT INTO "assortmentItem" (
      "assortmentItemId", "assortmentId", "productVariantId", "visibility", "buyable",
      "minQty", "maxQty", "incrementQty", "leadTimeDays", "discontinueDate", "sortOrder",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT ("assortmentId", "productVariantId") DO UPDATE SET
      "visibility" = EXCLUDED."visibility",
      "buyable" = EXCLUDED."buyable",
      "minQty" = EXCLUDED."minQty",
      "maxQty" = EXCLUDED."maxQty",
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING *
  `;

  const result = await query<{ rows: AssortmentItem[] }>(sql, [
    assortmentItemId,
    params.assortmentId,
    params.productVariantId,
    params.visibility || 'listed',
    params.buyable !== false,
    params.minQty || 1,
    params.maxQty || null,
    params.incrementQty || 1,
    params.leadTimeDays || null,
    params.discontinueDate || null,
    params.sortOrder || 0,
    now,
    now,
  ]);

  return result!.rows[0];
}

export async function removeAssortmentItem(
  assortmentId: string,
  productVariantId: string
): Promise<boolean> {
  const result = await query<{ rowCount: number }>(
    'DELETE FROM "assortmentItem" WHERE "assortmentId" = $1 AND "productVariantId" = $2',
    [assortmentId, productVariantId]
  );
  return (result?.rowCount ?? 0) > 0;
}

export async function getAssortmentItems(assortmentId: string): Promise<AssortmentItem[]> {
  const result = await query<{ rows: AssortmentItem[] }>(
    'SELECT * FROM "assortmentItem" WHERE "assortmentId" = $1 ORDER BY "sortOrder" ASC',
    [assortmentId]
  );
  return result?.rows ?? [];
}

export async function getVisibleProducts(
  storeId: string,
  options?: { limit?: number; offset?: number }
): Promise<any[]> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const sql = `
    SELECT pv.*, ai."minQty", ai."maxQty", ai."sortOrder"
    FROM "productVariant" pv
    JOIN "assortmentItem" ai ON ai."productVariantId" = pv."productVariantId"
    JOIN "assortmentScope" s ON s."assortmentId" = ai."assortmentId"
    WHERE s."storeId" = $1 
      AND ai."visibility" = 'listed' 
      AND ai."buyable" = true
      AND (ai."discontinueDate" IS NULL OR ai."discontinueDate" > CURRENT_DATE)
    ORDER BY ai."sortOrder" ASC
    LIMIT $2 OFFSET $3
  `;

  const result = await query<{ rows: any[] }>(sql, [storeId, limit, offset]);
  return result?.rows ?? [];
}

export default {
  createAssortment,
  findAssortmentById,
  findAssortmentsByOrganization,
  findDefaultAssortment,
  createAssortmentScope,
  findAssortmentsByStore,
  findAssortmentsBySeller,
  addAssortmentItem,
  removeAssortmentItem,
  getAssortmentItems,
  getVisibleProducts,
};
