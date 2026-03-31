import { query, queryOne } from '../../../../libs/db';

export interface MerchantSettlement {
  merchantSettlementId: string;
  merchantId: string;
  currency: string;
  grossAmount: number;
  commissionAmount: number;
  feeAmount: number;
  netAmount: number;
  status: string;
  periodStart: Date;
  periodEnd: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchantSettlementLine {
  merchantSettlementLineId: string;
  merchantSettlementId: string;
  orderId?: string;
  type: string;
  amount: number;
  description?: string;
  createdAt: Date;
}

export async function create(params: Omit<MerchantSettlement, 'merchantSettlementId' | 'createdAt' | 'updatedAt'>): Promise<MerchantSettlement | null> {
  const now = new Date();
  return queryOne<MerchantSettlement>(
    `INSERT INTO "merchantSettlement" ("merchantId", currency, "grossAmount", "commissionAmount", "feeAmount", "netAmount", status, "periodStart", "periodEnd", "processedAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [params.merchantId, params.currency, params.grossAmount, params.commissionAmount, params.feeAmount, params.netAmount, params.status, params.periodStart, params.periodEnd, params.processedAt || null, now, now],
  );
}

export async function findByMerchant(merchantId: string, limit = 20, offset = 0): Promise<MerchantSettlement[]> {
  return (await query<MerchantSettlement[]>(
    `SELECT * FROM "merchantSettlement" WHERE "merchantId" = $1 ORDER BY "periodEnd" DESC LIMIT $2 OFFSET $3`,
    [merchantId, limit, offset],
  )) || [];
}

export async function findById(merchantSettlementId: string): Promise<MerchantSettlement | null> {
  return queryOne<MerchantSettlement>(`SELECT * FROM "merchantSettlement" WHERE "merchantSettlementId" = $1`, [merchantSettlementId]);
}

export async function updateStatus(merchantSettlementId: string, status: string): Promise<void> {
  const now = new Date();
  await query(
    `UPDATE "merchantSettlement" SET status = $1, "processedAt" = $2, "updatedAt" = $3 WHERE "merchantSettlementId" = $4`,
    [status, status === 'processed' ? now : null, now, merchantSettlementId],
  );
}

export async function addLine(params: Omit<MerchantSettlementLine, 'merchantSettlementLineId' | 'createdAt'>): Promise<MerchantSettlementLine | null> {
  return queryOne<MerchantSettlementLine>(
    `INSERT INTO "merchantSettlementLine" ("merchantSettlementId", "orderId", type, amount, description, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [params.merchantSettlementId, params.orderId || null, params.type, params.amount, params.description || null, new Date()],
  );
}

export async function findLines(merchantSettlementId: string): Promise<MerchantSettlementLine[]> {
  return (await query<MerchantSettlementLine[]>(
    `SELECT * FROM "merchantSettlementLine" WHERE "merchantSettlementId" = $1 ORDER BY "createdAt" ASC`,
    [merchantSettlementId],
  )) || [];
}

export default { create, findByMerchant, findById, updateStatus, addLine, findLines };
