/**
 * paymentSettings, paymentWebhook and storedPaymentMethod queries.
 */

import { query, queryOne } from '../../../../libs/db';
import type {
  PaymentSettings,
  PaymentSettingsUpsertParams,
  PaymentWebhook,
  PaymentWebhookCreateParams,
  StoredPaymentMethod,
  StoredPaymentMethodCreateParams,
} from '../../domain/repositories/PaymentRepository';
import type { PaymentSettings as DbPaymentSettings, PaymentWebhook as DbPaymentWebhook } from '../../../../libs/db/types';

// Maps repository-facing field names onto the actual storedPaymentMethod schema
// (e.g. "paymentMethod" -> type, "token" -> providerToken).
const STORED_METHOD_COLUMNS = `"storedPaymentMethodId", "customerId", "paymentMethod" AS type, provider, token AS "providerToken", "lastFour" AS last4, "cardType" AS brand, NULLIF("expiryMonth", '')::int AS "expiryMonth", NULLIF("expiryYear", '')::int AS "expiryYear", "isDefault", "isExpired", "createdAt", "updatedAt"`;

type StoredPaymentMethodRow = StoredPaymentMethod;

function rowToSettings(row: DbPaymentSettings): PaymentSettings {
  return {
    ...row,
    threeDSecureSettings: (row.threeDSecureSettings ?? undefined) as Record<string, unknown> | undefined,
    fraudDetectionSettings: (row.fraudDetectionSettings ?? undefined) as Record<string, unknown> | undefined,
    receiptSettings: (row.receiptSettings ?? undefined) as Record<string, unknown> | undefined,
    paymentFormCustomization: (row.paymentFormCustomization ?? undefined) as Record<string, unknown> | undefined,
  };
}

function rowToWebhook(row: DbPaymentWebhook): PaymentWebhook {
  return {
    paymentWebhookId: row.paymentWebhookId,
    externalId: row.externalId as string,
    provider: row.provider,
    eventType: row.eventType,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    processedAt: row.processedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findSettingsByMerchant(organizationId: string): Promise<PaymentSettings | null> {
  const row = await queryOne<DbPaymentSettings>(`SELECT * FROM "paymentSettings" WHERE "organizationId" = $1`, [organizationId]);
  return row ? rowToSettings(row) : null;
}

export async function upsertSettings(params: PaymentSettingsUpsertParams): Promise<PaymentSettings | null> {
  const now = new Date();
  const jsonbFields = new Set(['threeDSecureSettings', 'fraudDetectionSettings', 'receiptSettings', 'paymentFormCustomization']);
  const fields = (Object.keys(params) as (keyof PaymentSettingsUpsertParams)[]).filter(
    key => key !== 'organizationId' && params[key] !== undefined,
  );

  const columns = ['"organizationId"', ...fields.map(f => `"${f}"`), '"createdAt"', '"updatedAt"'];
  const values: unknown[] = [
    params.organizationId,
    ...fields.map(f => (jsonbFields.has(f) ? JSON.stringify(params[f]) : params[f])),
    now,
    now,
  ];
  const updateSet = fields.length > 0 ? `${fields.map(f => `"${f}" = EXCLUDED."${f}"`).join(', ')}, ` : '';

  const row = await queryOne<DbPaymentSettings>(
    `INSERT INTO "paymentSettings" (${columns.join(', ')})
     VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')})
     ON CONFLICT ("organizationId") DO UPDATE SET ${updateSet}"updatedAt" = $${values.length}
     RETURNING *`,
    values,
  );
  return row ? rowToSettings(row) : null;
}

export async function findAllSettings(): Promise<PaymentSettings[]> {
  const rows = await query<DbPaymentSettings[]>(`SELECT * FROM "paymentSettings" ORDER BY "createdAt" DESC`);
  return (rows || []).map(rowToSettings);
}

export async function findWebhookByExternalId(externalId: string): Promise<PaymentWebhook | null> {
  const row = await queryOne<DbPaymentWebhook>(`SELECT * FROM "paymentWebhook" WHERE "externalId" = $1`, [externalId]);
  return row ? rowToWebhook(row) : null;
}

export async function createWebhook(params: PaymentWebhookCreateParams): Promise<PaymentWebhook | null> {
  const now = new Date();
  const row = await queryOne<DbPaymentWebhook>(
    `INSERT INTO "paymentWebhook" ("externalId", provider, "eventType", payload, "processedAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [params.externalId, params.provider, params.eventType, JSON.stringify(params.payload), params.processedAt || null, now, now],
  );
  return row ? rowToWebhook(row) : null;
}

export async function markWebhookProcessed(paymentWebhookId: string): Promise<PaymentWebhook | null> {
  const now = new Date();
  const row = await queryOne<DbPaymentWebhook>(
    `UPDATE "paymentWebhook" SET "processedAt" = $1, "updatedAt" = $1 WHERE "paymentWebhookId" = $2 RETURNING *`,
    [now, paymentWebhookId],
  );
  return row ? rowToWebhook(row) : null;
}

export async function findStoredMethodsByCustomer(customerId: string): Promise<StoredPaymentMethod[]> {
  return (
    (await query<StoredPaymentMethodRow[]>(
      `SELECT ${STORED_METHOD_COLUMNS} FROM "storedPaymentMethod" WHERE "customerId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC`,
      [customerId],
    )) || []
  );
}

export async function findStoredMethodById(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null> {
  return queryOne<StoredPaymentMethodRow>(
    `SELECT ${STORED_METHOD_COLUMNS} FROM "storedPaymentMethod" WHERE "storedPaymentMethodId" = $1`,
    [storedPaymentMethodId],
  );
}

export async function createStoredMethod(params: StoredPaymentMethodCreateParams): Promise<StoredPaymentMethod | null> {
  const now = new Date();
  return queryOne<StoredPaymentMethodRow>(
    `INSERT INTO "storedPaymentMethod" ("customerId", "paymentMethod", provider, token, "lastFour", "cardType", "expiryMonth", "expiryYear", "isDefault", "isExpired", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10, $11) RETURNING ${STORED_METHOD_COLUMNS}`,
    [
      params.customerId,
      params.type,
      params.provider,
      params.providerToken,
      params.last4 || null,
      params.brand || null,
      params.expiryMonth != null ? String(params.expiryMonth).padStart(2, '0') : null,
      params.expiryYear != null ? String(params.expiryYear) : null,
      params.isDefault,
      now,
      now,
    ],
  );
}

export async function setDefaultStoredMethod(storedPaymentMethodId: string, customerId: string): Promise<StoredPaymentMethod | null> {
  const now = new Date();
  await query(`UPDATE "storedPaymentMethod" SET "isDefault" = false, "updatedAt" = $1 WHERE "customerId" = $2`, [now, customerId]);
  return queryOne<StoredPaymentMethodRow>(
    `UPDATE "storedPaymentMethod" SET "isDefault" = true, "updatedAt" = $1 WHERE "storedPaymentMethodId" = $2 AND "customerId" = $3 RETURNING ${STORED_METHOD_COLUMNS}`,
    [now, storedPaymentMethodId, customerId],
  );
}

export async function softDeleteStoredMethod(storedPaymentMethodId: string, customerId?: string): Promise<StoredPaymentMethod | null> {
  // The table has no deletedAt column — a "soft" delete is a hard delete.
  const sql = customerId
    ? `DELETE FROM "storedPaymentMethod" WHERE "storedPaymentMethodId" = $1 AND "customerId" = $2 RETURNING ${STORED_METHOD_COLUMNS}`
    : `DELETE FROM "storedPaymentMethod" WHERE "storedPaymentMethodId" = $1 RETURNING ${STORED_METHOD_COLUMNS}`;
  return queryOne<StoredPaymentMethodRow>(sql, customerId ? [storedPaymentMethodId, customerId] : [storedPaymentMethodId]);
}
