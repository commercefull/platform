import { query, queryOne } from '../../../../libs/db';

export interface CommissionProfile {
  commissionProfileId: string;
  name: string;
  description?: string;
  defaultRate: number;
  categoryRates?: object;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findAll(limit = 50, offset = 0): Promise<CommissionProfile[]> {
  return (await query<CommissionProfile[]>(
    `SELECT * FROM "commissionProfile" ORDER BY name ASC LIMIT $1 OFFSET $2`,
    [limit, offset],
  )) || [];
}

export async function findById(commissionProfileId: string): Promise<CommissionProfile | null> {
  return queryOne<CommissionProfile>(
    `SELECT * FROM "commissionProfile" WHERE "commissionProfileId" = $1`,
    [commissionProfileId],
  );
}

export async function create(params: Omit<CommissionProfile, 'commissionProfileId' | 'createdAt' | 'updatedAt'>): Promise<CommissionProfile | null> {
  const now = new Date();
  return queryOne<CommissionProfile>(
    `INSERT INTO "commissionProfile" (name, description, "defaultRate", "categoryRates", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [params.name, params.description || null, params.defaultRate, params.categoryRates ? JSON.stringify(params.categoryRates) : null, params.isActive ?? true, now, now],
  );
}

export async function update(commissionProfileId: string, params: Partial<Omit<CommissionProfile, 'commissionProfileId' | 'createdAt' | 'updatedAt'>>): Promise<CommissionProfile | null> {
  const now = new Date();
  const fields: string[] = ['"updatedAt" = $1'];
  const values: unknown[] = [now];
  let idx = 2;

  if (params.name !== undefined) { fields.push(`name = $${idx++}`); values.push(params.name); }
  if (params.description !== undefined) { fields.push(`description = $${idx++}`); values.push(params.description); }
  if (params.defaultRate !== undefined) { fields.push(`"defaultRate" = $${idx++}`); values.push(params.defaultRate); }
  if (params.categoryRates !== undefined) { fields.push(`"categoryRates" = $${idx++}`); values.push(JSON.stringify(params.categoryRates)); }
  if (params.isActive !== undefined) { fields.push(`"isActive" = $${idx++}`); values.push(params.isActive); }

  values.push(commissionProfileId);
  return queryOne<CommissionProfile>(
    `UPDATE "commissionProfile" SET ${fields.join(', ')} WHERE "commissionProfileId" = $${idx} RETURNING *`,
    values,
  );
}

export default { findAll, findById, create, update };
