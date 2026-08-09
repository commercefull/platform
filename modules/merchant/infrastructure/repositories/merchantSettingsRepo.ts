/**
 * Merchant Settings Repository
 * Handles CRUD for the "merchantSettings" table
 */

import { query, queryOne } from '../../../../libs/db';
import type { MerchantSettings } from 'libs/db/types';

export type MerchantSettingsRecord = MerchantSettings;

export async function findByMerchantId(merchantId: string): Promise<MerchantSettingsRecord | null> {
  return queryOne<MerchantSettingsRecord>(`SELECT * FROM "merchantSettings" WHERE "merchantId" = $1`, [merchantId]);
}

export async function upsert(merchantId: string, params: {
  storeName?: string;
  storeUrl?: string;
  storeEmail?: string;
  storePhone?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  storeAddress?: string;
}): Promise<void> {
  const now = new Date();
  const existing = await queryOne<{ merchantId: string }>(`SELECT "merchantId" FROM "merchantSettings" WHERE "merchantId" = $1`, [merchantId]);

  if (existing) {
    await query(
      `UPDATE "merchantSettings" SET
        "storeName" = COALESCE($1, "storeName"),
        "storeUrl" = $2,
        "storeEmail" = $3,
        "storePhone" = $4,
        "timezone" = COALESCE($5, "timezone"),
        "currency" = COALESCE($6, "currency"),
        "locale" = COALESCE($7, "locale"),
        "storeAddress" = $8,
        "updatedAt" = $9
       WHERE "merchantId" = $10`,
      [params.storeName, params.storeUrl, params.storeEmail, params.storePhone, params.timezone, params.currency, params.locale, params.storeAddress, now, merchantId],
    );
  } else {
    await query(
      `INSERT INTO "merchantSettings" (
        "merchantId", "storeName", "storeUrl", "storeEmail", "storePhone",
        "timezone", "currency", "locale", "storeAddress", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [merchantId, params.storeName, params.storeUrl, params.storeEmail, params.storePhone, params.timezone, params.currency, params.locale, params.storeAddress, now, now],
    );
  }
}

export async function updateBusinessInfo(merchantId: string, businessInfo: string): Promise<void> {
  await query(
    `UPDATE "merchantSettings" SET "businessInfo" = $1, "updatedAt" = $2 WHERE "merchantId" = $3`,
    [businessInfo, new Date(), merchantId],
  );
}
