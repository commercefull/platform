import { query, queryOne } from '../../../../libs/db';

export interface MerchantOrder {
  merchantOrderId: string;
  merchantId: string;
  orderId: string;
  status: string;
  totalAmount: number;
  currency: string;
  commissionAmount?: number;
  netAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function findByMerchant(merchantId: string, limit = 20, offset = 0): Promise<MerchantOrder[]> {
  return (await query<MerchantOrder[]>(
    `SELECT * FROM "merchantOrder" WHERE "merchantId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
    [merchantId, limit, offset],
  )) || [];
}

export async function findById(merchantOrderId: string): Promise<MerchantOrder | null> {
  return queryOne<MerchantOrder>(
    `SELECT * FROM "merchantOrder" WHERE "merchantOrderId" = $1`,
    [merchantOrderId],
  );
}

export async function updateStatus(merchantOrderId: string, status: string): Promise<void> {
  await query(
    `UPDATE "merchantOrder" SET status = $1, "updatedAt" = $2 WHERE "merchantOrderId" = $3`,
    [status, new Date(), merchantOrderId],
  );
}

export default { findByMerchant, findById, updateStatus };
