/**
 * Currency Repository
 * Handles CRUD for the "currency" table
 */

import { query, queryOne } from '../../../../libs/db';
import type { Currency } from 'libs/db/types';
import { generateUUID as uuidv4 } from '../../../../libs/uuid';

export type CurrencyRecord = Currency;

export async function listCurrencies(): Promise<CurrencyRecord[]> {
  const rows = await query<CurrencyRecord[]>(`SELECT * FROM "currency" ORDER BY "name"`);
  return rows || [];
}

export async function listActiveCurrencyCodes(): Promise<{ code: string; name: string }[]> {
  const rows = await query<{ code: string; name: string }[]>(`SELECT "code", "name" FROM "currency" WHERE "isActive" = true ORDER BY "name"`);
  return rows || [];
}

export async function findCurrencyById(currencyId: string): Promise<CurrencyRecord | null> {
  return queryOne<CurrencyRecord>(`SELECT * FROM "currency" WHERE "currencyId" = $1`, [currencyId]);
}

export async function createCurrency(params: { code: string; name: string; symbol?: string; exchangeRate?: number; isDefault?: boolean; isActive?: boolean }): Promise<string> {
  const currencyId = uuidv4();
  const now = new Date();

  if (params.isDefault) {
    await query(`UPDATE "currency" SET "isDefault" = false`);
  }

  await query(
    `INSERT INTO "currency" ("currencyId", "code", "name", "symbol", "exchangeRate", "isDefault", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [currencyId, params.code.toUpperCase(), params.name, params.symbol || params.code, params.exchangeRate || 1, params.isDefault || false, params.isActive !== false, now, now],
  );

  return currencyId;
}

export async function updateCurrency(currencyId: string, updates: { name?: string; symbol?: string; exchangeRate?: number; isDefault?: boolean; isActive?: boolean }): Promise<void> {
  const now = new Date();

  if (updates.isDefault) {
    await query(`UPDATE "currency" SET "isDefault" = false`);
  }

  await query(
    `UPDATE "currency" SET
      "name" = COALESCE($1, "name"),
      "symbol" = COALESCE($2, "symbol"),
      "exchangeRate" = COALESCE($3, "exchangeRate"),
      "isDefault" = COALESCE($4, "isDefault"),
      "isActive" = COALESCE($5, "isActive"),
      "updatedAt" = $6
     WHERE "currencyId" = $7`,
    [updates.name, updates.symbol, updates.exchangeRate, updates.isDefault, updates.isActive, now, currencyId],
  );
}

export async function deleteCurrency(currencyId: string): Promise<void> {
  await query(`DELETE FROM "currency" WHERE "currencyId" = $1`, [currencyId]);
}
