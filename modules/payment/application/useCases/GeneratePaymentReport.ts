/**
 * GeneratePaymentReport Use Case
 *
 * Creates a payment report snapshot for a merchant over a given date range.
 *
 * Validates: Requirements 1.8
 */

import paymentReportRepo, { PaymentReport } from '../../infrastructure/repositories/paymentReportRepo';

// ============================================================================
// Command
// ============================================================================

export class GeneratePaymentReportCommand {
  constructor(
    public readonly merchantId: string,
    public readonly type: string,
    public readonly currency: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly totalAmount: number,
    public readonly transactionCount: number,
    public readonly data?: Record<string, any>,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface GeneratePaymentReportResponse {
  paymentReportId: string;
  merchantId: string;
  type: string;
  currency: string;
  totalAmount: number;
  transactionCount: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class GeneratePaymentReportUseCase {
  constructor(private readonly repo: typeof paymentReportRepo = paymentReportRepo) {}

  async execute(command: GeneratePaymentReportCommand): Promise<GeneratePaymentReportResponse> {
    if (command.periodEnd <= command.periodStart) {
      throw new Error('periodEnd must be after periodStart');
    }

    const report = await this.repo.create({
      merchantId: command.merchantId,
      type: command.type,
      currency: command.currency,
      totalAmount: command.totalAmount,
      transactionCount: command.transactionCount,
      data: command.data,
      periodStart: command.periodStart,
      periodEnd: command.periodEnd,
    });

    if (!report) {
      throw new Error('Failed to generate payment report');
    }

    return this.mapToResponse(report);
  }

  private mapToResponse(r: PaymentReport): GeneratePaymentReportResponse {
    return {
      paymentReportId: r.paymentReportId,
      merchantId: r.merchantId,
      type: r.type,
      currency: r.currency,
      totalAmount: r.totalAmount,
      transactionCount: r.transactionCount,
      periodStart: r.periodStart.toISOString(),
      periodEnd: r.periodEnd.toISOString(),
      createdAt: r.createdAt.toISOString(),
    };
  }
}
