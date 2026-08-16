import { query, queryOne } from '../../../../libs/db';
import { FulfillmentPartner } from '../../../../libs/db/types';

export type { FulfillmentPartner };

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

export async function create(
  params: Omit<FulfillmentPartner, 'fulfillmentPartnerId' | 'createdAt' | 'updatedAt'>,
): Promise<FulfillmentPartner | null> {
  const now = new Date();
  return queryOne<FulfillmentPartner>(
    `INSERT INTO "fulfillmentPartner" (name, code, type, "isActive", "apiConfig", "address", "contactEmail", "contactPhone", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      params.name,
      params.code,
      params.type,
      params.isActive,
      params.apiConfig ? JSON.stringify(params.apiConfig) : null,
      params.address ? JSON.stringify(params.address) : null,
      params.contactEmail || null,
      params.contactPhone || null,
      now,
      now,
    ],
  );
}

export async function update(
  fulfillmentPartnerId: string,
  params: Partial<Omit<FulfillmentPartner, 'fulfillmentPartnerId' | 'code' | 'createdAt' | 'updatedAt'>>,
): Promise<FulfillmentPartner | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.name !== undefined) { fields.push(`name = $${idx++}`); values.push(params.name); }
  if (params.type !== undefined) { fields.push(`type = $${idx++}`); values.push(params.type); }
  if (params.isActive !== undefined) { fields.push(`"isActive" = $${idx++}`); values.push(params.isActive); }
  if (params.apiConfig !== undefined) { fields.push(`"apiConfig" = $${idx++}`); values.push(JSON.stringify(params.apiConfig)); }
  if (params.address !== undefined) { fields.push(`"address" = $${idx++}`); values.push(JSON.stringify(params.address)); }
  if (params.contactEmail !== undefined) { fields.push(`"contactEmail" = $${idx++}`); values.push(params.contactEmail); }
  if (params.contactPhone !== undefined) { fields.push(`"contactPhone" = $${idx++}`); values.push(params.contactPhone); }

  if (fields.length === 0) return findById(fulfillmentPartnerId);

  fields.push(`"updatedAt" = $${idx++}`);
  values.push(new Date());
  values.push(fulfillmentPartnerId);

  return queryOne<FulfillmentPartner>(
    `UPDATE "fulfillmentPartner" SET ${fields.join(', ')} WHERE "fulfillmentPartnerId" = $${idx} RETURNING *`,
    values,
  );
}

export async function remove(fulfillmentPartnerId: string): Promise<boolean> {
  await query('DELETE FROM "fulfillmentPartner" WHERE "fulfillmentPartnerId" = $1', [fulfillmentPartnerId]);
  return true;
}

export default { findAll, findById, findByCode, create, update, remove };
