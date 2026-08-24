/**
 * GeneratePaymentReport Use Case
 *
 * Creates a payment report snapshot for a merchant over a given date range.
 *
 * Validates: Requirements 1.8
 */

import { PaymentBillingRepository, PaymentReport } from '../../domain/repositories/PaymentBillingRepository';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';

const paymentBillingRepo = paymentBillingDataRepository.billing;
import { PeriodEndMustBeAfterStartError, FailedToGenerateReportError } from '../../domain/errors/PaymentErrors';

// ============================================================================
// Command
// ============================================================================

export class GeneratePaymentReportCommand {
  constructor(
    public readonly organizationId: string,
    public readonly type: string,
    public readonly currency: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly totalAmount: number,
    public readonly transactionCount: number,
    public readonly data?: Record<string, unknown>,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface GeneratePaymentReportResponse {
  paymentReportId: string;
  organizationId: string;
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
  constructor(private readonly repo: PaymentBillingRepository = paymentBillingRepo) {}

  async execute(command: GeneratePaymentReportCommand): Promise<GeneratePaymentReportResponse> {
    if (command.periodEnd <= command.periodStart) {
      throw new PeriodEndMustBeAfterStartError();
    }

    const report = await this.repo.createReport({
      organizationId: command.organizationId,
      type: command.type,
      currency: command.currency,
      totalAmount: command.totalAmount,
      transactionCount: command.transactionCount,
      data: command.data,
      periodStart: command.periodStart,
      periodEnd: command.periodEnd,
    });

    if (!report) {
      throw new FailedToGenerateReportError();
    }

    return this.mapToResponse(report);
  }

  private mapToResponse(r: PaymentReport): GeneratePaymentReportResponse {
    return {
      paymentReportId: r.paymentReportId,
      organizationId: r.organizationId,
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
