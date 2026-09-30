/**
 * Currency Repository
 * Handles CRUD for the "currency" table. Exchange rates live in
 * "currencyExchangeRate" (rate relative to the default/base currency) —
 * surfaced here as `exchangeRate` for callers that read CurrencyRecord.
 */

import { query, queryOne } from '../../../../libs/db';
import type { Currency as DbCurrency } from 'libs/db/types';

export type CurrencyRecord = DbCurrency & { exchangeRate?: number };

// Latest active rate vs the base (default) currency
const LATEST_RATE = `(
  SELECT r."rate" FROM "currencyExchangeRate" r
  WHERE r."targetCurrencyId" = c."currencyId" AND r."isActive" = true
  ORDER BY r."effectiveFrom" DESC LIMIT 1
) as "exchangeRate"`;

async function findBaseCurrencyId(excludeId?: string): Promise<string | null> {
  const row = await queryOne<{ currencyId: string }>(
    `SELECT "currencyId" FROM "currency" WHERE "isDefault" = true AND "currencyId" <> $1 LIMIT 1`,
    [excludeId ?? '00000000-0000-0000-0000-000000000000'],
  );
  return row?.currencyId ?? null;
}

async function writeExchangeRate(targetCurrencyId: string, rate: number, effectiveFrom: Date, source: string): Promise<void> {
  const baseId = await findBaseCurrencyId(targetCurrencyId);
  if (!baseId) return; // this is the base currency — a self-rate is meaningless
  await query(
    `INSERT INTO "currencyExchangeRate"
       ("sourceCurrencyId", "targetCurrencyId", "rate", "inverseRate",
        "effectiveFrom", "isActive", "provider", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, true, $6, NOW(), NOW())`,
    [baseId, targetCurrencyId, rate, rate !== 0 ? 1 / rate : null, effectiveFrom, source],
  );
}

export async function listCurrencies(): Promise<CurrencyRecord[]> {
  const rows = await query<CurrencyRecord[]>(`SELECT c.*, ${LATEST_RATE} FROM "currency" c ORDER BY c."name"`);
  return rows || [];
}

export async function listActiveCurrencyCodes(): Promise<{ code: string; name: string }[]> {
  const rows = await query<{ code: string; name: string }[]>(
    `SELECT "code", "name" FROM "currency" WHERE "isActive" = true ORDER BY "name"`,
  );
  return rows || [];
}

export async function findCurrencyById(currencyId: string): Promise<CurrencyRecord | null> {
  return queryOne<CurrencyRecord>(`SELECT c.*, ${LATEST_RATE} FROM "currency" c WHERE c."currencyId" = $1`, [currencyId]);
}

export async function findCurrencyByCode(code: string): Promise<CurrencyRecord | null> {
  return queryOne<CurrencyRecord>(`SELECT c.*, ${LATEST_RATE} FROM "currency" c WHERE c."code" = $1`, [code.toUpperCase()]);
}

export async function createCurrency(params: {
  code: string;
  name: string;
  symbol?: string;
  exchangeRate?: number;
  isDefault?: boolean;
  isActive?: boolean;
}): Promise<string> {
  const now = new Date();

  if (params.isDefault) {
    await query(`UPDATE "currency" SET "isDefault" = false`);
  }

  const row = await queryOne<{ currencyId: string }>(
    `INSERT INTO "currency" ("code", "name", "symbol", "isDefault", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING "currencyId"`,
    [params.code.toUpperCase(), params.name, params.symbol || params.code, params.isDefault || false, params.isActive !== false, now, now],
  );
  const currencyId = row!.currencyId;

  if (params.exchangeRate && !params.isDefault) {
    await writeExchangeRate(currencyId, params.exchangeRate, now, 'manual');
  }

  return currencyId;
}

export async function updateCurrency(
  currencyId: string,
  updates: { name?: string; symbol?: string; exchangeRate?: number; isDefault?: boolean; isActive?: boolean; lastRateUpdate?: Date },
): Promise<void> {
  const now = new Date();

  if (updates.isDefault) {
    await query(`UPDATE "currency" SET "isDefault" = false`);
  }

  await query(
    `UPDATE "currency" SET
      "name" = COALESCE($1, "name"),
      "symbol" = COALESCE($2, "symbol"),
      "isDefault" = COALESCE($3, "isDefault"),
      "isActive" = COALESCE($4, "isActive"),
      "updatedAt" = $5
     WHERE "currencyId" = $6`,
    [updates.name, updates.symbol, updates.isDefault, updates.isActive, now, currencyId],
  );

  if (updates.exchangeRate !== undefined) {
    await writeExchangeRate(currencyId, updates.exchangeRate, updates.lastRateUpdate ?? now, 'manual');
  }
}

export async function createExchangeRateHistory(data: {
  currencyCode: string;
  rate: number;
  previousRate: number;
  effectiveDate: Date;
  source: string;
}): Promise<void> {
  const currency = await findCurrencyByCode(data.currencyCode);
  if (!currency) return;
  await writeExchangeRate(currency.currencyId, data.rate, data.effectiveDate, data.source);
}

export async function deleteCurrency(currencyId: string): Promise<void> {
  await query(`DELETE FROM "currency" WHERE "currencyId" = $1`, [currencyId]);
}
