import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export interface PaymentBalance {
  paymentBalanceId: string;
  organizationId: string;
  currency: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BalanceTransaction {
  paymentBalanceId: string;
  organizationId: string;
  currency: string;
  amount: number;
  type: 'credit' | 'debit';
  referenceId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDispute {
  paymentDisputeId: string;
  paymentId: string;
  organizationId: string;
  externalDisputeId?: string;
  status: string;
  reason?: string;
  amount: number;
  currency: string;
  evidence?: Record<string, unknown>;
  dueBy?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentFee {
  paymentFeeId: string;
  transactionId: string;
  organizationId: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeSum {
  organizationId: string;
  totalAmount: number;
  currency: string;
}

export interface PaymentReport {
  paymentReportId: string;
  organizationId: string;
  type: string;
  currency: string;
  totalAmount: number;
  transactionCount: number;
  data?: Record<string, unknown>;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Consolidated Payment Billing Repository
// ============================================================================

class PaymentBillingRepo {
  // --- Balances ---

  async findBalancesByMerchant(organizationId: string): Promise<PaymentBalance[]> {
    return (
      (await query<PaymentBalance[]>(`SELECT * FROM "paymentBalance" WHERE "organizationId" = $1 ORDER BY currency ASC`, [organizationId])) || []
    );
  }

  async creditBalance(organizationId: string, currency: string, amount: number): Promise<PaymentBalance | null> {
    const now = new Date();
    return queryOne<PaymentBalance>(
      `INSERT INTO "paymentBalance" ("organizationId", currency, amount, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("organizationId", currency) DO UPDATE SET amount = "paymentBalance".amount + $3, "updatedAt" = $5
       RETURNING *`,
      [organizationId, currency, amount, now, now],
    );
  }

  async debitBalance(organizationId: string, currency: string, amount: number): Promise<PaymentBalance | null> {
    const now = new Date();
    return queryOne<PaymentBalance>(
      `UPDATE "paymentBalance" SET amount = amount - $1, "updatedAt" = $2
       WHERE "organizationId" = $3 AND currency = $4
       RETURNING *`,
      [amount, now, organizationId, currency],
    );
  }

  async getBalance(organizationId: string, currency: string): Promise<number> {
    const result = await queryOne<{ amount: string }>(
      `SELECT COALESCE(amount, 0) AS amount FROM "paymentBalance" WHERE "organizationId" = $1 AND currency = $2`,
      [organizationId, currency],
    );
    return result ? parseFloat(result.amount) : 0;
  }

  async findAllBalances(): Promise<PaymentBalance[]> {
    return (
      (await query<PaymentBalance[]>(`SELECT * FROM "paymentBalance" ORDER BY "organizationId", currency`)) || []
    );
  }

  // --- Disputes ---

  async findDisputesByPayment(paymentId: string): Promise<PaymentDispute[]> {
    return (
      (await query<PaymentDispute[]>(`SELECT * FROM "paymentDispute" WHERE "paymentId" = $1 ORDER BY "createdAt" DESC`, [paymentId])) || []
    );
  }

  async findDisputeById(paymentDisputeId: string): Promise<PaymentDispute | null> {
    return queryOne<PaymentDispute>(`SELECT * FROM "paymentDispute" WHERE "paymentDisputeId" = $1`, [paymentDisputeId]);
  }

  async createDispute(params: Omit<PaymentDispute, 'paymentDisputeId' | 'createdAt' | 'updatedAt'>): Promise<PaymentDispute | null> {
    const now = new Date();
    return queryOne<PaymentDispute>(
      `INSERT INTO "paymentDispute" ("paymentId", "organizationId", "externalDisputeId", status, reason, amount, currency, evidence, "dueBy", "resolvedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        params.paymentId,
        params.organizationId,
        params.externalDisputeId || null,
        params.status,
        params.reason || null,
        params.amount,
        params.currency,
        params.evidence ? JSON.stringify(params.evidence) : null,
        params.dueBy || null,
        params.resolvedAt || null,
        now,
        now,
      ],
    );
  }

  async updateDisputeStatus(paymentDisputeId: string, status: string, resolvedAt?: Date): Promise<PaymentDispute | null> {
    return queryOne<PaymentDispute>(
      `UPDATE "paymentDispute" SET status = $1, "resolvedAt" = $2, "updatedAt" = $3 WHERE "paymentDisputeId" = $4 RETURNING *`,
      [status, resolvedAt || null, new Date(), paymentDisputeId],
    );
  }

  async findAllDisputes(status?: string, limit: number = 100): Promise<PaymentDispute[]> {
    if (status) {
      return (
        (await query<PaymentDispute[]>(
          `SELECT * FROM "paymentDispute" WHERE status = $1 ORDER BY "createdAt" DESC LIMIT $2`,
          [status, limit],
        )) || []
      );
    }
    return (
      (await query<PaymentDispute[]>(`SELECT * FROM "paymentDispute" ORDER BY "createdAt" DESC LIMIT $1`, [limit])) || []
    );
  }

  // --- Fees ---

  async findFeesByTransaction(transactionId: string): Promise<PaymentFee[]> {
    return (
      (await query<PaymentFee[]>(`SELECT * FROM "paymentFee" WHERE "transactionId" = $1 ORDER BY "createdAt" DESC`, [transactionId])) || []
    );
  }

  async createFee(params: Omit<PaymentFee, 'paymentFeeId' | 'createdAt' | 'updatedAt'>): Promise<PaymentFee | null> {
    const now = new Date();
    return queryOne<PaymentFee>(
      `INSERT INTO "paymentFee" ("transactionId", "organizationId", type, amount, currency, description, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [params.transactionId, params.organizationId, params.type, params.amount, params.currency, params.description || null, now, now],
    );
  }

  async sumFeesByMerchant(organizationId: string, currency: string): Promise<number> {
    const result = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM "paymentFee" WHERE "organizationId" = $1 AND currency = $2`,
      [organizationId, currency],
    );
    return result ? parseFloat(result.total) : 0;
  }

  async findAllFees(limit: number = 100): Promise<PaymentFee[]> {
    return (
      (await query<PaymentFee[]>(`SELECT * FROM "paymentFee" ORDER BY "createdAt" DESC LIMIT $1`, [limit])) || []
    );
  }

  // --- Reports ---

  async findReportsByMerchant(organizationId: string): Promise<PaymentReport[]> {
    return (
      (await query<PaymentReport[]>(`SELECT * FROM "paymentReport" WHERE "organizationId" = $1 ORDER BY "periodStart" DESC`, [organizationId])) || []
    );
  }

  async findReportsByDateRange(organizationId: string, from: Date, to: Date): Promise<PaymentReport[]> {
    return (
      (await query<PaymentReport[]>(
        `SELECT * FROM "paymentReport" WHERE "organizationId" = $1 AND "periodStart" >= $2 AND "periodEnd" <= $3 ORDER BY "periodStart" DESC`,
        [organizationId, from, to],
      )) || []
    );
  }

  async createReport(params: Omit<PaymentReport, 'paymentReportId' | 'createdAt' | 'updatedAt'>): Promise<PaymentReport | null> {
    const now = new Date();
    return queryOne<PaymentReport>(
      `INSERT INTO "paymentReport" ("organizationId", type, currency, "totalAmount", "transactionCount", data, "periodStart", "periodEnd", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        params.organizationId,
        params.type,
        params.currency,
        params.totalAmount,
        params.transactionCount,
        params.data ? JSON.stringify(params.data) : null,
        params.periodStart,
        params.periodEnd,
        now,
        now,
      ],
    );
  }

  async findAllReports(limit: number = 100): Promise<PaymentReport[]> {
    return (
      (await query<PaymentReport[]>(`SELECT * FROM "paymentReport" ORDER BY "periodStart" DESC LIMIT $1`, [limit])) || []
    );
  }

  async findReportById(paymentReportId: string): Promise<PaymentReport | null> {
    return queryOne<PaymentReport>(`SELECT * FROM "paymentReport" WHERE "paymentReportId" = $1`, [paymentReportId]);
  }
}

export default new PaymentBillingRepo();
