/**
 * Admin Tax Repository
 * Handles legacy tax queries for the admin hub that use the older schema
 * (taxRate with country/state/taxClass columns, taxZone with countries array, taxClass table)
 */

import { query } from '../../../../libs/db';
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
// Tax Rate Functions
// ============================================================================

export async function findAllTaxRates(): Promise<AdminTaxRate[]> {
  return (await query<AdminTaxRate[]>(`SELECT * FROM "taxRate" WHERE "deletedAt" IS NULL ORDER BY "name"`)) || [];
}

export async function createTaxRate(params: {
  name: string;
  rate: number;
  country?: string;
  state?: string;
  taxClass?: string;
  isActive: boolean;
}): Promise<void> {
  await query(
    `INSERT INTO "taxRate" ("taxRateId", "name", "rate", "country", "state", "taxClass", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [generateUUID(), params.name, params.rate, params.country || null, params.state || null, params.taxClass || null, params.isActive],
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
  await query(
    `UPDATE "taxRate" SET "name" = $1, "rate" = $2, "country" = $3, "state" = $4, "taxClass" = $5, "isActive" = $6, "updatedAt" = NOW()
     WHERE "taxRateId" = $7`,
    [params.name, params.rate, params.country || null, params.state || null, params.taxClass || null, params.isActive, taxRateId],
  );
}

export async function softDeleteTaxRate(taxRateId: string): Promise<void> {
  await query(`UPDATE "taxRate" SET "deletedAt" = NOW() WHERE "taxRateId" = $1`, [taxRateId]);
}

// ============================================================================
// Tax Zone Functions
// ============================================================================

export async function findAllTaxZones(): Promise<AdminTaxZone[]> {
  return (await query<AdminTaxZone[]>(`SELECT * FROM "taxZone" WHERE "deletedAt" IS NULL ORDER BY "name"`)) || [];
}

export async function createTaxZone(params: {
  name: string;
  description?: string;
  countries: string[];
  isActive: boolean;
}): Promise<void> {
  await query(
    `INSERT INTO "taxZone" ("taxZoneId", "name", "description", "countries", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
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
    `UPDATE "taxZone" SET "name" = $1, "description" = $2, "countries" = $3, "isActive" = $4, "updatedAt" = NOW()
     WHERE "taxZoneId" = $5`,
    [params.name, params.description || null, JSON.stringify(params.countries), params.isActive, taxZoneId],
  );
}

export async function softDeleteTaxZone(taxZoneId: string): Promise<void> {
  await query(`UPDATE "taxZone" SET "deletedAt" = NOW() WHERE "taxZoneId" = $1`, [taxZoneId]);
}

// ============================================================================
// Tax Class Functions
// ============================================================================

export async function findAllTaxClasses(): Promise<AdminTaxClass[]> {
  return (
    (await query<AdminTaxClass[]>(
      `SELECT tc.*, COUNT(p."productId") as "productCount"
       FROM "taxClass" tc
       LEFT JOIN "product" p ON tc."taxClassId" = p."taxClass"
       WHERE tc."deletedAt" IS NULL
       GROUP BY tc."taxClassId"
       ORDER BY tc."name"`,
    )) || []
  );
}

export async function createTaxClass(params: { name: string; description?: string }): Promise<void> {
  await query(
    `INSERT INTO "taxClass" ("taxClassId", "name", "description", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [generateUUID(), params.name, params.description || null],
  );
}

export async function updateTaxClass(taxClassId: string, params: { name: string; description?: string }): Promise<void> {
  await query(`UPDATE "taxClass" SET "name" = $1, "description" = $2, "updatedAt" = NOW() WHERE "taxClassId" = $3`, [
    params.name,
    params.description || null,
    taxClassId,
  ]);
}

export async function softDeleteTaxClass(taxClassId: string): Promise<void> {
  await query(`UPDATE "taxClass" SET "deletedAt" = NOW() WHERE "taxClassId" = $1`, [taxClassId]);
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
