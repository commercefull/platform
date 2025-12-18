import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type SubscriptionInvoiceStatus = 'draft' | 'open' | 'paid' | 'past_due' | 'failed' | 'voided';

export interface SubscriptionInvoice {
  subscriptionInvoiceId: string;
  paymentSubscriptionId: string;
  customerId: string;
  merchantId: string;
  amount: number;
  currencyCode: string;
  status: SubscriptionInvoiceStatus;
  dueDate: string;
  paidDate?: string;
  periodStart: string;
  periodEnd: string;
  orderPaymentId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  items: any;
  subtotal: number;
  tax: number;
  discount: number;
  gatewayInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type SubscriptionInvoiceCreateParams = Omit<SubscriptionInvoice, 'subscriptionInvoiceId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type SubscriptionInvoiceUpdateParams = Partial<Omit<SubscriptionInvoice, 'subscriptionInvoiceId' | 'paymentSubscriptionId' | 'customerId' | 'merchantId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export class SubscriptionInvoiceRepo {
  async findById(id: string): Promise<SubscriptionInvoice | null> {
    return await queryOne<SubscriptionInvoice>(
      `SELECT * FROM "subscriptionInvoice" WHERE "subscriptionInvoiceId" = $1 AND "deletedAt" IS NULL`,
      [id]
    );
  }

  async findBySubscription(paymentSubscriptionId: string, limit = 100): Promise<SubscriptionInvoice[]> {
    return (await query<SubscriptionInvoice[]>(
      `SELECT * FROM "subscriptionInvoice" WHERE "paymentSubscriptionId" = $1 AND "deletedAt" IS NULL ORDER BY "dueDate" DESC LIMIT $2`,
      [paymentSubscriptionId, limit]
    )) || [];
  }

  async findByCustomer(customerId: string, status?: SubscriptionInvoiceStatus, limit = 100): Promise<SubscriptionInvoice[]> {
    let sql = `SELECT * FROM "subscriptionInvoice" WHERE "customerId" = $1 AND "deletedAt" IS NULL`;
    const params: any[] = [customerId];
    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }
    sql += ` ORDER BY "dueDate" DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    return (await query<SubscriptionInvoice[]>(sql, params)) || [];
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<SubscriptionInvoice | null> {
    return await queryOne<SubscriptionInvoice>(
      `SELECT * FROM "subscriptionInvoice" WHERE "invoiceNumber" = $1 AND "deletedAt" IS NULL`,
      [invoiceNumber]
    );
  }

  async findOverdue(): Promise<SubscriptionInvoice[]> {
    return (await query<SubscriptionInvoice[]>(
      `SELECT * FROM "subscriptionInvoice" WHERE "status" IN ('open', 'past_due') AND "dueDate" < $1 AND "deletedAt" IS NULL ORDER BY "dueDate" ASC`,
      [unixTimestamp()]
    )) || [];
  }

  async create(params: SubscriptionInvoiceCreateParams): Promise<SubscriptionInvoice> {
    const now = unixTimestamp();
    const result = await queryOne<SubscriptionInvoice>(
      `INSERT INTO "subscriptionInvoice" (
        "paymentSubscriptionId", "customerId", "merchantId", "amount", "currencyCode", "status",
        "dueDate", "paidDate", "periodStart", "periodEnd", "orderPaymentId", "invoiceNumber",
        "invoiceUrl", "items", "subtotal", "tax", "discount", "gatewayInvoiceId", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
      [
        params.paymentSubscriptionId, params.customerId, params.merchantId, params.amount,
        params.currencyCode || 'USD', params.status || 'draft', params.dueDate, params.paidDate || null,
        params.periodStart, params.periodEnd, params.orderPaymentId || null, params.invoiceNumber || null,
        params.invoiceUrl || null, JSON.stringify(params.items), params.subtotal, params.tax || 0,
        params.discount || 0, params.gatewayInvoiceId || null, now, now
      ]
    );
    if (!result) throw new Error('Failed to create subscription invoice');
    return result;
  }

  async update(id: string, params: SubscriptionInvoiceUpdateParams): Promise<SubscriptionInvoice | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(key === 'items' ? JSON.stringify(value) : value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<SubscriptionInvoice>(
      `UPDATE "subscriptionInvoice" SET ${updateFields.join(', ')} WHERE "subscriptionInvoiceId" = $${paramIndex} AND "deletedAt" IS NULL RETURNING *`,
      values
    );
  }

  async markPaid(id: string, orderPaymentId?: string): Promise<SubscriptionInvoice | null> {
    return this.update(id, { status: 'paid', paidDate: unixTimestamp(), orderPaymentId });
  }

  async markFailed(id: string): Promise<SubscriptionInvoice | null> {
    return this.update(id, { status: 'failed' });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ subscriptionInvoiceId: string }>(
      `UPDATE "subscriptionInvoice" SET "deletedAt" = $1 WHERE "subscriptionInvoiceId" = $2 AND "deletedAt" IS NULL RETURNING "subscriptionInvoiceId"`,
      [unixTimestamp(), id]
    );
    return !!result;
  }

  async count(paymentSubscriptionId?: string, status?: SubscriptionInvoiceStatus): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "subscriptionInvoice" WHERE "deletedAt" IS NULL`;
    const params: any[] = [];

    if (paymentSubscriptionId) {
      sql += ` AND "paymentSubscriptionId" = $${params.length + 1}`;
      params.push(paymentSubscriptionId);
    }
    if (status) {
      sql += ` AND "status" = $${params.length + 1}`;
      params.push(status);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new SubscriptionInvoiceRepo();
