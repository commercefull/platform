import { query, queryOne } from '../../../../libs/db';

// Column lists map the repository-facing field names onto the actual table
// schema (e.g. "currencyCode" -> currency, "availableAmount" -> amount).
const BALANCE_COLUMNS = `"paymentBalanceId", "organizationId", "currencyCode" AS currency, "availableAmount" AS amount, "createdAt", "updatedAt"`;
const DISPUTE_COLUMNS = `"paymentDisputeId", "orderPaymentId" AS "paymentId", "organizationId", "gatewayDisputeId" AS "externalDisputeId", status, reason, amount, "currencyCode" AS currency, "evidenceDetails" AS evidence, "evidenceDueBy" AS "dueBy", "resolvedAt", "createdAt", "updatedAt"`;
const FEE_COLUMNS = `"paymentFeeId", "orderPaymentId" AS "transactionId", "organizationId", type, amount, "currencyCode" AS currency, description, "createdAt", "updatedAt"`;
const REPORT_COLUMNS = `"paymentReportId", "organizationId", type, "parameters"->>'currency' AS currency, COALESCE(("parameters"->>'totalAmount')::numeric, 0)::float8 AS "totalAmount", COALESCE(("parameters"->>'transactionCount')::int, 0) AS "transactionCount", "parameters" AS data, lower("dateRange") AS "periodStart", upper("dateRange") AS "periodEnd", "createdAt", "updatedAt"`;

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
      (await query<PaymentBalance[]>(
        `SELECT ${BALANCE_COLUMNS} FROM "paymentBalance" WHERE "organizationId" = $1 ORDER BY "currencyCode" ASC`,
        [organizationId],
      )) || []
    );
  }

  async creditBalance(organizationId: string, currency: string, amount: number): Promise<PaymentBalance | null> {
    const now = new Date();
    return queryOne<PaymentBalance>(
      `INSERT INTO "paymentBalance" ("organizationId", "currencyCode", "availableAmount", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("organizationId", "currencyCode") DO UPDATE SET "availableAmount" = "paymentBalance"."availableAmount" + $3, "updatedAt" = $5
       RETURNING ${BALANCE_COLUMNS}`,
      [organizationId, currency, amount, now, now],
    );
  }

  async debitBalance(organizationId: string, currency: string, amount: number): Promise<PaymentBalance | null> {
    const now = new Date();
    return queryOne<PaymentBalance>(
      `UPDATE "paymentBalance" SET "availableAmount" = "availableAmount" - $1, "updatedAt" = $2
       WHERE "organizationId" = $3 AND "currencyCode" = $4
       RETURNING ${BALANCE_COLUMNS}`,
      [amount, now, organizationId, currency],
    );
  }

  async getBalance(organizationId: string, currency: string): Promise<number> {
    const result = await queryOne<{ amount: string }>(
      `SELECT COALESCE("availableAmount", 0) AS amount FROM "paymentBalance" WHERE "organizationId" = $1 AND "currencyCode" = $2`,
      [organizationId, currency],
    );
    return result ? parseFloat(result.amount) : 0;
  }

  async findAllBalances(): Promise<PaymentBalance[]> {
    return (
      (await query<PaymentBalance[]>(`SELECT ${BALANCE_COLUMNS} FROM "paymentBalance" ORDER BY "organizationId", "currencyCode"`)) || []
    );
  }

  // --- Disputes ---

  async findDisputesByPayment(paymentId: string): Promise<PaymentDispute[]> {
    return (
      (await query<PaymentDispute[]>(
        `SELECT ${DISPUTE_COLUMNS} FROM "paymentDispute" WHERE "orderPaymentId" = $1 ORDER BY "createdAt" DESC`,
        [paymentId],
      )) || []
    );
  }

  async findDisputeById(paymentDisputeId: string): Promise<PaymentDispute | null> {
    return queryOne<PaymentDispute>(`SELECT ${DISPUTE_COLUMNS} FROM "paymentDispute" WHERE "paymentDisputeId" = $1`, [
      paymentDisputeId,
    ]);
  }

  async createDispute(params: Omit<PaymentDispute, 'paymentDisputeId' | 'createdAt' | 'updatedAt'>): Promise<PaymentDispute | null> {
    const now = new Date();
    const validStatuses = ['pending', 'underReview', 'won', 'lost', 'withdrawn'];
    return queryOne<PaymentDispute>(
      `INSERT INTO "paymentDispute" ("orderPaymentId", "organizationId", "gatewayDisputeId", status, reason, amount, "currencyCode", "evidenceDetails", "evidenceDueBy", "resolvedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING ${DISPUTE_COLUMNS}`,
      [
        params.paymentId || null,
        params.organizationId,
        params.externalDisputeId || null,
        validStatuses.includes(params.status) ? params.status : 'pending',
        params.reason || 'unspecified',
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
      `UPDATE "paymentDispute" SET status = $1, "resolvedAt" = $2, "updatedAt" = $3 WHERE "paymentDisputeId" = $4 RETURNING ${DISPUTE_COLUMNS}`,
      [status, resolvedAt || null, new Date(), paymentDisputeId],
    );
  }

  async findAllDisputes(status?: string, limit: number = 100): Promise<PaymentDispute[]> {
    if (status) {
      return (
        (await query<PaymentDispute[]>(
          `SELECT ${DISPUTE_COLUMNS} FROM "paymentDispute" WHERE status = $1 ORDER BY "createdAt" DESC LIMIT $2`,
          [status, limit],
        )) || []
      );
    }
    return (
      (await query<PaymentDispute[]>(`SELECT ${DISPUTE_COLUMNS} FROM "paymentDispute" ORDER BY "createdAt" DESC LIMIT $1`, [limit])) ||
      []
    );
  }

  // --- Fees ---

  async findFeesByTransaction(transactionId: string): Promise<PaymentFee[]> {
    return (
      (await query<PaymentFee[]>(`SELECT ${FEE_COLUMNS} FROM "paymentFee" WHERE "orderPaymentId" = $1 ORDER BY "createdAt" DESC`, [
        transactionId,
      ])) || []
    );
  }

  async createFee(params: Omit<PaymentFee, 'paymentFeeId' | 'createdAt' | 'updatedAt'>): Promise<PaymentFee | null> {
    const now = new Date();
    const validTypes = ['transaction', 'subscription', 'dispute', 'refund', 'chargeback', 'payout', 'platform', 'other'];
    return queryOne<PaymentFee>(
      `INSERT INTO "paymentFee" ("orderPaymentId", "organizationId", type, amount, "currencyCode", description, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${FEE_COLUMNS}`,
      [
        params.transactionId || null,
        params.organizationId,
        validTypes.includes(params.type) ? params.type : 'other',
        params.amount,
        params.currency,
        params.description || null,
        now,
        now,
      ],
    );
  }

  async sumFeesByMerchant(organizationId: string, currency: string): Promise<number> {
    const result = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM "paymentFee" WHERE "organizationId" = $1 AND "currencyCode" = $2`,
      [organizationId, currency],
    );
    return result ? parseFloat(result.total) : 0;
  }

  async findAllFees(limit: number = 100): Promise<PaymentFee[]> {
    return (await query<PaymentFee[]>(`SELECT ${FEE_COLUMNS} FROM "paymentFee" ORDER BY "createdAt" DESC LIMIT $1`, [limit])) || [];
  }

  // --- Reports ---

  async findReportsByMerchant(organizationId: string): Promise<PaymentReport[]> {
    return (
      (await query<PaymentReport[]>(`SELECT ${REPORT_COLUMNS} FROM "paymentReport" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`, [
        organizationId,
      ])) || []
    );
  }

  async findReportsByDateRange(organizationId: string, from: Date, to: Date): Promise<PaymentReport[]> {
    return (
      (await query<PaymentReport[]>(
        `SELECT ${REPORT_COLUMNS} FROM "paymentReport" WHERE "organizationId" = $1 AND lower("dateRange") >= $2 AND upper("dateRange") <= $3 ORDER BY "createdAt" DESC`,
        [organizationId, from, to],
      )) || []
    );
  }

  async createReport(params: Omit<PaymentReport, 'paymentReportId' | 'createdAt' | 'updatedAt'>): Promise<PaymentReport | null> {
    const now = new Date();
    const validTypes = ['transaction', 'payout', 'fee', 'settlement', 'summary', 'tax', 'custom'];
    const parameters = {
      currency: params.currency,
      totalAmount: params.totalAmount,
      transactionCount: params.transactionCount,
      ...(params.data || {}),
    };
    return queryOne<PaymentReport>(
      `INSERT INTO "paymentReport" ("organizationId", name, type, format, parameters, "dateRange", status, "generatedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'json', $4, tstzrange($5, $6, '[)'), 'completed', $7, $7, $7) RETURNING ${REPORT_COLUMNS}`,
      [
        params.organizationId,
        `${params.type} report`,
        validTypes.includes(params.type) ? params.type : 'custom',
        JSON.stringify(parameters),
        params.periodStart,
        params.periodEnd,
        now,
      ],
    );
  }

  async findAllReports(limit: number = 100): Promise<PaymentReport[]> {
    return (
      (await query<PaymentReport[]>(`SELECT ${REPORT_COLUMNS} FROM "paymentReport" ORDER BY "createdAt" DESC LIMIT $1`, [limit])) || []
    );
  }

  async findReportById(paymentReportId: string): Promise<PaymentReport | null> {
    return queryOne<PaymentReport>(`SELECT ${REPORT_COLUMNS} FROM "paymentReport" WHERE "paymentReportId" = $1`, [paymentReportId]);
  }
}

export default new PaymentBillingRepo();
