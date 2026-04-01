import { query, queryOne } from '../../../../libs/db';

export interface SellerPolicy {
  sellerPolicyId: string;
  merchantId: string;
  policyType: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(merchantId: string): Promise<SellerPolicy[]> {
  return (await query<SellerPolicy[]>(
    `SELECT * FROM "sellerPolicy" WHERE "merchantId" = $1 ORDER BY "policyType" ASC`,
    [merchantId],
  )) || [];
}

export async function create(params: Omit<SellerPolicy, 'sellerPolicyId' | 'createdAt' | 'updatedAt'>): Promise<SellerPolicy | null> {
  const now = new Date();
  return queryOne<SellerPolicy>(
    `INSERT INTO "sellerPolicy" ("merchantId", "policyType", title, content, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [params.merchantId, params.policyType, params.title, params.content, params.isActive ?? true, now, now],
  );
}

export async function update(sellerPolicyId: string, params: Partial<Omit<SellerPolicy, 'sellerPolicyId' | 'merchantId' | 'createdAt' | 'updatedAt'>>): Promise<SellerPolicy | null> {
  const now = new Date();
  const fields: string[] = ['"updatedAt" = $1'];
  const values: unknown[] = [now];
  let idx = 2;

  if (params.policyType !== undefined) { fields.push(`"policyType" = $${idx++}`); values.push(params.policyType); }
  if (params.title !== undefined) { fields.push(`title = $${idx++}`); values.push(params.title); }
  if (params.content !== undefined) { fields.push(`content = $${idx++}`); values.push(params.content); }
  if (params.isActive !== undefined) { fields.push(`"isActive" = $${idx++}`); values.push(params.isActive); }

  values.push(sellerPolicyId);
  return queryOne<SellerPolicy>(
    `UPDATE "sellerPolicy" SET ${fields.join(', ')} WHERE "sellerPolicyId" = $${idx} RETURNING *`,
    values,
  );
}

export default { findByMerchant, create, update };
