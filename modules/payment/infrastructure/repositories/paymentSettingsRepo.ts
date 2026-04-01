import { queryOne } from '../../../../libs/db';

export interface PaymentSettings {
  paymentSettingsId: string;
  merchantId: string;
  provider: string;
  isEnabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(merchantId: string): Promise<PaymentSettings | null> {
  return queryOne<PaymentSettings>(
    `SELECT * FROM "paymentSettings" WHERE "merchantId" = $1`,
    [merchantId],
  );
}

export async function upsert(
  params: Omit<PaymentSettings, 'paymentSettingsId' | 'createdAt' | 'updatedAt'>,
): Promise<PaymentSettings | null> {
  const now = new Date();
  return queryOne<PaymentSettings>(
    `INSERT INTO "paymentSettings" ("merchantId", provider, "isEnabled", config, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ("merchantId") DO UPDATE SET provider = $2, "isEnabled" = $3, config = $4, "updatedAt" = $6
     RETURNING *`,
    [params.merchantId, params.provider, params.isEnabled, JSON.stringify(params.config), now, now],
  );
}

export default { findByMerchant, upsert };
