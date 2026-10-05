/**
 * Admin Tax Repository
 * Handles legacy tax queries for the admin hub.
 * taxRate requires taxCategoryId + taxZoneId (resolved from the form's
 * taxClass/country/state inputs); tax "classes" map onto taxCategory.
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';

// ============================================================================
// Types
// ============================================================================

export interface AdminTaxRate {
  taxRateId: string;
  name: string;
  rate: number;
  country?: string;
  state?: string;
  taxClass?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AdminTaxZone {
  taxZoneId: string;
  name: string;
  description?: string;
  countries?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface AdminTaxClass {
  taxClassId: string;
  name: string;
  description?: string;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ============================================================================
// Resolution helpers
// ============================================================================

async function resolveTaxCategoryId(nameOrCode?: string): Promise<string> {
  const row = await queryOne<{ taxCategoryId: string }>(
    `SELECT "taxCategoryId" FROM "taxCategory"
     WHERE "isActive" = true AND ($1::text IS NULL OR "code" = $1 OR "name" = $1)
     ORDER BY ("isDefault") DESC, "sortOrder" ASC LIMIT 1`,
    [nameOrCode ?? null],
  );
  const fallback =
    row ??
    (await queryOne<{ taxCategoryId: string }>(
      `SELECT "taxCategoryId" FROM "taxCategory" ORDER BY "isDefault" DESC, "sortOrder" ASC LIMIT 1`,
    ));
  if (!fallback) throw new Error('No tax category exists — create one before adding rates');
  return fallback.taxCategoryId;
}

async function resolveTaxZoneId(country?: string, state?: string): Promise<string> {
  const row = await queryOne<{ taxZoneId: string }>(
    `SELECT "taxZoneId" FROM "taxZone"
     WHERE "isActive" = true
       AND ($1::text IS NULL OR "countries" @> to_jsonb(ARRAY[$1]::text[]))
       AND ($2::text IS NULL OR "states" IS NULL OR "states" @> to_jsonb(ARRAY[$2]::text[]))
     ORDER BY ("isDefault") DESC LIMIT 1`,
    [country ?? null, state ?? null],
  );
  const fallback = row ?? (await queryOne<{ taxZoneId: string }>(`SELECT "taxZoneId" FROM "taxZone" ORDER BY "isDefault" DESC LIMIT 1`));
  if (!fallback) throw new Error('No tax zone exists — create one before adding rates');
  return fallback.taxZoneId;
}

// ============================================================================
// Tax Rate Functions
// ============================================================================

export async function findAllTaxRates(): Promise<AdminTaxRate[]> {
  return (
    (await query<AdminTaxRate[]>(
      `SELECT tr.*, tc."name" as "taxClass", tz."name" as "country"
       FROM "taxRate" tr
       LEFT JOIN "taxCategory" tc ON tr."taxCategoryId" = tc."taxCategoryId"
       LEFT JOIN "taxZone" tz ON tr."taxZoneId" = tz."taxZoneId"
       ORDER BY tr."name"`,
    )) || []
  );
}

export async function createTaxRate(params: {
  name: string;
  rate: number;
  country?: string;
  state?: string;
  taxClass?: string;
  isActive: boolean;
}): Promise<void> {
  const [taxCategoryId, taxZoneId] = await Promise.all([
    resolveTaxCategoryId(params.taxClass),
    resolveTaxZoneId(params.country, params.state),
  ]);
  await query(
    `INSERT INTO "taxRate" ("taxRateId", "taxCategoryId", "taxZoneId", "name", "rate", "type", "priority", "isCompound", "includeInPrice", "isShippingTaxable", "startDate", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 'percentage', 0, false, false, false, NOW(), $6, NOW(), NOW())`,
    [generateUUID(), taxCategoryId, taxZoneId, params.name, params.rate, params.isActive],
  );
}

export async function updateTaxRate(
  taxRateId: string,
  params: {
    name: string;
    rate: number;
    country?: string;
    state?: string;
    taxClass?: string;
    isActive: boolean;
  },
): Promise<void> {
  const [taxCategoryId, taxZoneId] = await Promise.all([
    resolveTaxCategoryId(params.taxClass),
    resolveTaxZoneId(params.country, params.state),
  ]);
  await query(
    `UPDATE "taxRate" SET "name" = $1, "rate" = $2, "taxCategoryId" = $3, "taxZoneId" = $4, "isActive" = $5, "updatedAt" = NOW()
     WHERE "taxRateId" = $6`,
    [params.name, params.rate, taxCategoryId, taxZoneId, params.isActive, taxRateId],
  );
}

export async function softDeleteTaxRate(taxRateId: string): Promise<void> {
  await query(`UPDATE "taxRate" SET "isActive" = false, "updatedAt" = NOW() WHERE "taxRateId" = $1`, [taxRateId]);
}

// ============================================================================
// Tax Zone Functions
// ============================================================================

export async function findAllTaxZones(): Promise<AdminTaxZone[]> {
  return (await query<AdminTaxZone[]>(`SELECT * FROM "taxZone" ORDER BY "name"`)) || [];
}

export async function createTaxZone(params: { name: string; description?: string; countries: string[]; isActive: boolean }): Promise<void> {
  await query(
    `INSERT INTO "taxZone" ("taxZoneId", "name", "description", "countries", "isDefault", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::jsonb, false, $5, NOW(), NOW())`,
    [generateUUID(), params.name, params.description || null, JSON.stringify(params.countries), params.isActive],
  );
}

export async function updateTaxZone(
  taxZoneId: string,
  params: {
    name: string;
    description?: string;
    countries: string[];
    isActive: boolean;
  },
): Promise<void> {
  await query(
    `UPDATE "taxZone" SET "name" = $1, "description" = $2, "countries" = $3::jsonb, "isActive" = $4, "updatedAt" = NOW()
     WHERE "taxZoneId" = $5`,
    [params.name, params.description || null, JSON.stringify(params.countries), params.isActive, taxZoneId],
  );
}

export async function softDeleteTaxZone(taxZoneId: string): Promise<void> {
  await query(`UPDATE "taxZone" SET "isActive" = false, "updatedAt" = NOW() WHERE "taxZoneId" = $1`, [taxZoneId]);
}

// ============================================================================
// Tax Class Functions — backed by the taxCategory table
// ============================================================================

export async function findAllTaxClasses(): Promise<AdminTaxClass[]> {
  return (
    (await query<AdminTaxClass[]>(
      `SELECT tc."taxCategoryId" as "taxClassId", tc."name", tc."description", tc."isActive", tc."createdAt", tc."updatedAt",
              COUNT(p."productId") as "productCount"
       FROM "taxCategory" tc
       LEFT JOIN "product" p ON p."taxClass" = tc."code"
       GROUP BY tc."taxCategoryId"
       ORDER BY tc."name"`,
    )) || []
  );
}

export async function createTaxClass(params: { name: string; description?: string }): Promise<void> {
  await query(
    `INSERT INTO "taxCategory" ("taxCategoryId", "code", "name", "description", "sortOrder", "isDefault", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 0, false, true, NOW(), NOW())`,
    [generateUUID(), params.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), params.name, params.description || null],
  );
}

export async function updateTaxClass(taxClassId: string, params: { name: string; description?: string }): Promise<void> {
  await query(`UPDATE "taxCategory" SET "name" = $1, "description" = $2, "updatedAt" = NOW() WHERE "taxCategoryId" = $3`, [
    params.name,
    params.description || null,
    taxClassId,
  ]);
}

export async function softDeleteTaxClass(taxClassId: string): Promise<void> {
  await query(`UPDATE "taxCategory" SET "isActive" = false, "updatedAt" = NOW() WHERE "taxCategoryId" = $1`, [taxClassId]);
}

export default {
  findAllTaxRates,
  createTaxRate,
  updateTaxRate,
  softDeleteTaxRate,
  findAllTaxZones,
  createTaxZone,
  updateTaxZone,
  softDeleteTaxZone,
  findAllTaxClasses,
  createTaxClass,
  updateTaxClass,
  softDeleteTaxClass,
};
