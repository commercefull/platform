import { query, queryOne } from '../../../../libs/db';

export interface MerchantShippingTemplate {
  merchantShippingTemplateId: string;
  merchantId: string;
  name: string;
  carrier?: string;
  estimatedDays?: number;
  baseRate?: number;
  currency?: string;
  isActive: boolean;
  rules?: object;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export async function findByMerchant(merchantId: string): Promise<MerchantShippingTemplate[]> {
  return (await query<MerchantShippingTemplate[]>(
    `SELECT * FROM "merchantShippingTemplate" WHERE "merchantId" = $1 AND "deletedAt" IS NULL ORDER BY name ASC`,
    [merchantId],
  )) || [];
}

export async function findById(merchantShippingTemplateId: string): Promise<MerchantShippingTemplate | null> {
  return queryOne<MerchantShippingTemplate>(
    `SELECT * FROM "merchantShippingTemplate" WHERE "merchantShippingTemplateId" = $1 AND "deletedAt" IS NULL`,
    [merchantShippingTemplateId],
  );
}

export async function create(params: Omit<MerchantShippingTemplate, 'merchantShippingTemplateId' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<MerchantShippingTemplate | null> {
  const now = new Date();
  return queryOne<MerchantShippingTemplate>(
    `INSERT INTO "merchantShippingTemplate" ("merchantId", name, carrier, "estimatedDays", "baseRate", currency, "isActive", rules, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [params.merchantId, params.name, params.carrier || null, params.estimatedDays || null, params.baseRate || null, params.currency || null, params.isActive ?? true, params.rules ? JSON.stringify(params.rules) : null, now, now],
  );
}

export async function update(merchantShippingTemplateId: string, params: Partial<Omit<MerchantShippingTemplate, 'merchantShippingTemplateId' | 'merchantId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<MerchantShippingTemplate | null> {
  const now = new Date();
  const fields: string[] = ['"updatedAt" = $1'];
  const values: unknown[] = [now];
  let idx = 2;

  if (params.name !== undefined) { fields.push(`name = $${idx++}`); values.push(params.name); }
  if (params.carrier !== undefined) { fields.push(`carrier = $${idx++}`); values.push(params.carrier); }
  if (params.estimatedDays !== undefined) { fields.push(`"estimatedDays" = $${idx++}`); values.push(params.estimatedDays); }
  if (params.baseRate !== undefined) { fields.push(`"baseRate" = $${idx++}`); values.push(params.baseRate); }
  if (params.currency !== undefined) { fields.push(`currency = $${idx++}`); values.push(params.currency); }
  if (params.isActive !== undefined) { fields.push(`"isActive" = $${idx++}`); values.push(params.isActive); }
  if (params.rules !== undefined) { fields.push(`rules = $${idx++}`); values.push(JSON.stringify(params.rules)); }

  values.push(merchantShippingTemplateId);
  return queryOne<MerchantShippingTemplate>(
    `UPDATE "merchantShippingTemplate" SET ${fields.join(', ')} WHERE "merchantShippingTemplateId" = $${idx} RETURNING *`,
    values,
  );
}

export async function softDelete(merchantShippingTemplateId: string): Promise<void> {
  await query(
    `UPDATE "merchantShippingTemplate" SET "deletedAt" = $1, "updatedAt" = $2 WHERE "merchantShippingTemplateId" = $3`,
    [new Date(), new Date(), merchantShippingTemplateId],
  );
}

export default { findByMerchant, findById, create, update, softDelete };
