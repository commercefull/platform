import { query, queryOne } from '../../../../libs/db';

export interface MerchantInvoice {
  merchantInvoiceId: string;
  merchantId: string;
  invoiceNumber: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  dueDate?: Date;
  paidAt?: Date;
  periodStart?: Date;
  periodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function create(params: Omit<MerchantInvoice, 'merchantInvoiceId' | 'createdAt' | 'updatedAt'>): Promise<MerchantInvoice | null> {
  const now = new Date();
  return queryOne<MerchantInvoice>(
    `INSERT INTO "merchantInvoice" ("merchantId", "invoiceNumber", type, amount, currency, status, "dueDate", "paidAt", "periodStart", "periodEnd", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [params.merchantId, params.invoiceNumber, params.type, params.amount, params.currency, params.status, params.dueDate || null, params.paidAt || null, params.periodStart || null, params.periodEnd || null, now, now],
  );
}

export async function findByMerchant(merchantId: string, limit = 20, offset = 0): Promise<MerchantInvoice[]> {
  return (await query<MerchantInvoice[]>(
    `SELECT * FROM "merchantInvoice" WHERE "merchantId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
    [merchantId, limit, offset],
  )) || [];
}

export async function findById(merchantInvoiceId: string): Promise<MerchantInvoice | null> {
  return queryOne<MerchantInvoice>(`SELECT * FROM "merchantInvoice" WHERE "merchantInvoiceId" = $1`, [merchantInvoiceId]);
}

export async function markPaid(merchantInvoiceId: string): Promise<void> {
  const now = new Date();
  await query(`UPDATE "merchantInvoice" SET status = 'paid', "paidAt" = $1, "updatedAt" = $2 WHERE "merchantInvoiceId" = $3`, [now, now, merchantInvoiceId]);
}

export default { create, findByMerchant, findById, markPaid };
