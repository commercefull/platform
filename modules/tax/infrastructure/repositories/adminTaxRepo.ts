/**
 * Admin Tax Repository
 * Handles legacy tax queries for the admin hub.
 * taxRate requires taxCategoryId + taxZoneId (resolved from the form's
 * taxClass/country/state inputs); tax "classes" map onto taxCategory.
 *
 * Writes delegate to TaxCommandRepo — the single owner of
 * taxRate/taxZone/taxCategory mutation SQL.
 */

import { query, queryOne } from '../../../../libs/db';
import { TaxCommandRepo } from './taxCommandRepo';
import type { TaxZone as DbTaxZone } from '../../../../libs/db/types';

const commands = new TaxCommandRepo();

// ============================================================================
// Types
// ============================================================================

interface AdminTaxRate {
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

interface AdminTaxZone {
  taxZoneId: string;
  name: string;
  description?: string;
  countries?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface AdminTaxClass {
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

const deriveCode = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

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
  await commands.createTaxRate({
    taxCategoryId,
    taxZoneId,
    name: params.name,
    rate: params.rate,
    type: 'percentage',
    priority: 0,
    isCompound: false,
    includeInPrice: false,
    isShippingTaxable: false,
    startDate: new Date(),
    isActive: params.isActive,
  });
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
  await commands.updateTaxRate(taxRateId, {
    name: params.name,
    rate: params.rate,
    taxCategoryId,
    taxZoneId,
    isActive: params.isActive,
  });
}

export async function softDeleteTaxRate(taxRateId: string): Promise<void> {
  await commands.updateTaxRate(taxRateId, { isActive: false });
}

// ============================================================================
// Tax Zone Functions
// ============================================================================

export async function findAllTaxZones(): Promise<AdminTaxZone[]> {
  const rows = (await query<DbTaxZone[]>(`SELECT * FROM "taxZone" ORDER BY "name"`)) as DbTaxZone[] | null;
  return (rows || []).map(row => ({
    taxZoneId: row.taxZoneId,
    name: row.name,
    description: row.description ?? undefined,
    countries: Array.isArray(row.countries) ? (row.countries as string[]) : undefined,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function createTaxZone(params: { name: string; description?: string; countries: string[]; isActive: boolean }): Promise<void> {
  await commands.createTaxZone({
    name: params.name,
    code: deriveCode(params.name),
    description: params.description,
    isDefault: false,
    countries: params.countries,
    isActive: params.isActive,
  });
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
  await commands.updateTaxZone(taxZoneId, {
    name: params.name,
    description: (params.description || null) as string | undefined,
    countries: params.countries,
    isActive: params.isActive,
  });
}

export async function softDeleteTaxZone(taxZoneId: string): Promise<void> {
  await commands.updateTaxZone(taxZoneId, { isActive: false });
}

// ============================================================================
// Tax Class Functions (mapped onto taxCategory)
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
  await commands.createTaxCategory({
    name: params.name,
    code: deriveCode(params.name),
    description: params.description,
    isDefault: false,
    sortOrder: 0,
    isActive: true,
  });
}

export async function updateTaxClass(taxClassId: string, params: { name: string; description?: string }): Promise<void> {
  await commands.updateTaxCategory(taxClassId, { name: params.name, description: (params.description || null) as string | undefined });
}

export async function softDeleteTaxClass(taxClassId: string): Promise<void> {
  await commands.updateTaxCategory(taxClassId, { isActive: false });
}
