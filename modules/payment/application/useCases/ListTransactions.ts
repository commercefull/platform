import { PaymentRepository, PaymentFilters } from '../../domain/repositories/PaymentRepository';
import { PaginationOptions } from 'libs/types/shared';
import { TransactionStatus } from '../../domain/valueObjects/PaymentStatus';
import type { TransactionDetailResponse } from './GetTransaction';

export class ListTransactionsCommand {
  constructor(
    public readonly filters?: {
      orderId?: string;
      customerId?: string;
      status?: TransactionStatus | TransactionStatus[];
      gatewayId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    public readonly limit: number = 50,
    public readonly offset: number = 0,
    public readonly orderBy: string = 'createdAt',
    public readonly orderDirection: 'asc' | 'desc' = 'desc',
  ) {}
}

// ============================================================================
// Response
// ============================================================================


export interface ListTransactionsResponse {
  transactions: TransactionDetailResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// Use Case
// ============================================================================


export class ListTransactionsUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(command: ListTransactionsCommand): Promise<ListTransactionsResponse> {
    const filters: PaymentFilters = command.filters || {};
    const pagination: PaginationOptions = {
      limit: command.limit,
      offset: command.offset,
      orderBy: command.orderBy,
      orderDirection: command.orderDirection,
    };

    const result = await this.paymentRepository.findAllTransactions(filters, pagination);

    return {
      transactions: result.data.map(t => ({
        transactionId: t.transactionId,
        orderId: t.orderId,
        customerId: t.customerId,
        paymentMethodConfigId: t.paymentMethodConfigId,
        gatewayId: t.gatewayId,
        externalTransactionId: t.externalTransactionId,
        amountCents: t.amountCents,
        currency: t.currency,
        status: t.status,
        refundedAmountCents: t.refundedAmountCents,
        refundableAmount: t.refundableAmount,
        isPaid: t.isPaid,
        canBeRefunded: t.canBeRefunded,
        authorizedAt: t.authorizedAt?.toISOString(),
        capturedAt: t.capturedAt?.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  }
}
