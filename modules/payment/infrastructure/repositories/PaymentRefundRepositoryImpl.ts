import { query, queryOne } from '../../../../libs/db';
import type { PaymentRefundRepository } from '../../domain/repositories/PaymentRefundRepository';
import { PaymentRefund } from '../../domain/entities/PaymentRefund';
import { RefundStatus } from '../../domain/valueObjects/PaymentStatus';
import type { PaymentRefund as DbPaymentRefund } from '../../../../libs/db/types';

class PaymentRefundRepo implements PaymentRefundRepository {
  async findRefundById(refundId: string): Promise<PaymentRefund | null> {
    const row = await queryOne<DbPaymentRefund>('SELECT * FROM "paymentRefund" WHERE "paymentRefundId" = $1', [refundId]);
    return row ? this.mapToRefund(row) : null;
  }

  async findRefundsByTransactionId(transactionId: string): Promise<PaymentRefund[]> {
    const rows = await query<DbPaymentRefund[]>(
      'SELECT * FROM "paymentRefund" WHERE "paymentTransactionId" = $1 ORDER BY "createdAt" DESC',
      [transactionId],
    );
    return (rows || []).map(row => this.mapToRefund(row));
  }

  async saveRefund(refund: PaymentRefund): Promise<PaymentRefund> {
    const now = new Date().toISOString();

    const existing = await queryOne<{ paymentRefundId: string }>(
      'SELECT "paymentRefundId" FROM "paymentRefund" WHERE "paymentRefundId" = $1',
      [refund.refundId],
    );

    if (existing) {
      await query(
        `UPDATE "paymentRefund" SET
          "externalRefundId" = $1, status = $2, "gatewayResponse" = $3,
          "errorCode" = $4, "errorMessage" = $5, "processedAt" = $6,
          metadata = $7, "updatedAt" = $8
        WHERE "paymentRefundId" = $9`,
        [
          refund.externalRefundId,
          refund.status,
          refund.gatewayResponse ? JSON.stringify(refund.gatewayResponse) : null,
          refund.errorCode,
          refund.errorMessage,
          refund.processedAt?.toISOString(),
          refund.metadata ? JSON.stringify(refund.metadata) : null,
          now,
          refund.refundId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "paymentRefund" (
          "paymentRefundId", "paymentTransactionId", "amountCents", "currencyCode", reason, status, metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          refund.refundId,
          refund.transactionId,
          refund.amountCents,
          refund.currency,
          refund.reason,
          refund.status,
          refund.metadata ? JSON.stringify(refund.metadata) : null,
          now,
          now,
        ],
      );
    }

    return refund;
  }

  private mapToRefund(row: Record<string, unknown>): PaymentRefund {
    return PaymentRefund.reconstitute({
      refundId: row.paymentRefundId as string,
      transactionId: row.paymentTransactionId as string,
      externalRefundId: row.externalRefundId as string | undefined,
      amountCents: Number(row.amountCents),
      currency: row.currencyCode as string,
      reason: row.reason as string | undefined,
      status: row.status as RefundStatus,
      gatewayResponse: row.gatewayResponse
        ? typeof row.gatewayResponse === 'string'
          ? JSON.parse(row.gatewayResponse)
          : row.gatewayResponse
        : undefined,
      errorCode: row.errorCode as string | undefined,
      errorMessage: row.errorMessage as string | undefined,
      processedAt: row.processedAt ? new Date(row.processedAt as string) : undefined,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    });
  }
}

export default new PaymentRefundRepo();
