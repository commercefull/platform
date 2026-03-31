import { query, queryOne } from '../../../../libs/db';

export interface FulfillmentPartner {
  fulfillmentPartnerId: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
  apiEndpoint?: string;
  credentials?: Record<string, any>;
  supportedRegions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export async function findAll(activeOnly = true): Promise<FulfillmentPartner[]> {
  const sql = activeOnly
    ? `SELECT * FROM "fulfillmentPartner" WHERE "isActive" = true ORDER BY name ASC`
    : `SELECT * FROM "fulfillmentPartner" ORDER BY name ASC`;
  return (await query<FulfillmentPartner[]>(sql)) || [];
}

export async function findById(fulfillmentPartnerId: string): Promise<FulfillmentPartner | null> {
  return queryOne<FulfillmentPartner>(`SELECT * FROM "fulfillmentPartner" WHERE "fulfillmentPartnerId" = $1`, [fulfillmentPartnerId]);
}

export async function findByCode(code: string): Promise<FulfillmentPartner | null> {
  return queryOne<FulfillmentPartner>(`SELECT * FROM "fulfillmentPartner" WHERE code = $1`, [code]);
}

export async function create(params: Omit<FulfillmentPartner, 'fulfillmentPartnerId' | 'createdAt' | 'updatedAt'>): Promise<FulfillmentPartner | null> {
  const now = new Date();
  return queryOne<FulfillmentPartner>(
    `INSERT INTO "fulfillmentPartner" (name, code, type, "isActive", "apiEndpoint", credentials, "supportedRegions", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [params.name, params.code, params.type, params.isActive, params.apiEndpoint || null, params.credentials ? JSON.stringify(params.credentials) : null, params.supportedRegions ? JSON.stringify(params.supportedRegions) : null, now, now],
  );
}

export default { findAll, findById, findByCode, create };
