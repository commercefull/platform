import { query, queryOne } from '../../../../libs/db';

export interface PaymentSettings {
  paymentSettingsId: string;
  organizationId: string;
  provider: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(organizationId: string): Promise<PaymentSettings | null> {
  return queryOne<PaymentSettings>(`SELECT * FROM "paymentSettings" WHERE "organizationId" = $1`, [organizationId]);
}

export async function upsert(
  params: Omit<PaymentSettings, 'paymentSettingsId' | 'createdAt' | 'updatedAt'>,
): Promise<PaymentSettings | null> {
  const now = new Date();
  return queryOne<PaymentSettings>(
    `INSERT INTO "paymentSettings" ("organizationId", provider, "isEnabled", config, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ("organizationId") DO UPDATE SET provider = $2, "isEnabled" = $3, config = $4, "updatedAt" = $6
     RETURNING *`,
    [params.organizationId, params.provider, params.isEnabled, JSON.stringify(params.config), now, now],
  );
}

export async function findAll(): Promise<PaymentSettings[]> {
  return (await query<PaymentSettings[]>(`SELECT * FROM "paymentSettings" ORDER BY "createdAt" DESC`)) || [];
}

export default { findByMerchant, upsert, findAll };
