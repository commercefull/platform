import { queryOne } from '../../../../libs/db';

export interface MerchantTaxInfo {
  merchantTaxInfoId: string;
  merchantId: string;
  taxNumber?: string;
  vatNumber?: string;
  taxCountry?: string;
  taxRegion?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(merchantId: string): Promise<MerchantTaxInfo | null> {
  return queryOne<MerchantTaxInfo>(
    `SELECT * FROM "merchantTaxInfo" WHERE "merchantId" = $1`,
    [merchantId],
  );
}

export async function upsert(params: Omit<MerchantTaxInfo, 'merchantTaxInfoId' | 'createdAt' | 'updatedAt'>): Promise<MerchantTaxInfo | null> {
  const now = new Date();
  return queryOne<MerchantTaxInfo>(
    `INSERT INTO "merchantTaxInfo" ("merchantId", "taxNumber", "vatNumber", "taxCountry", "taxRegion", "isVerified", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT ("merchantId") DO UPDATE SET
       "taxNumber" = EXCLUDED."taxNumber",
       "vatNumber" = EXCLUDED."vatNumber",
       "taxCountry" = EXCLUDED."taxCountry",
       "taxRegion" = EXCLUDED."taxRegion",
       "isVerified" = EXCLUDED."isVerified",
       "updatedAt" = $8
     RETURNING *`,
    [params.merchantId, params.taxNumber || null, params.vatNumber || null, params.taxCountry || null, params.taxRegion || null, params.isVerified ?? false, now, now],
  );
}

export default { findByMerchant, upsert };
