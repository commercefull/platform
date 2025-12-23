/**
 * Get Transactions Use Case
 */

import { PaymentRepository, PaymentFilters, PaginationOptions } from '../../domain/repositories/PaymentRepository';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import { TransactionStatus } from '../../domain/valueObjects/PaymentStatus';

// ============================================================================
// Command
// ============================================================================

export class GetTransactionCommand {
  constructor(
    public readonly transactionId?: string,
    public readonly externalId?: string,
  ) {
    if (!transactionId && !externalId) {
      throw new Error('Either transactionId or externalId must be provided');
    }
  }
}

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

export interface TransactionDetailResponse {
  transactionId: string;
  orderId: string;
  customerId?: string;
  paymentMethodConfigId: string;
  gatewayId: string;
  externalTransactionId?: string;
  amount: number;
  currency: string;
  status: string;
  refundedAmount: number;
  refundableAmount: number;
  isPaid: boolean;
  canBeRefunded: boolean;
  authorizedAt?: string;
  capturedAt?: string;
  createdAt: string;
  updatedAt: string;
}

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

export class GetTransactionUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(command: GetTransactionCommand): Promise<TransactionDetailResponse | null> {
    let transaction: PaymentTransaction | null = null;

    if (command.transactionId) {
      transaction = await this.paymentRepository.findTransactionById(command.transactionId);
    } else if (command.externalId) {
      transaction = await this.paymentRepository.findTransactionByExternalId(command.externalId);
    }

    if (!transaction) {
      return null;
    }

    return this.mapToResponse(transaction);
  }

  private mapToResponse(t: PaymentTransaction): TransactionDetailResponse {
    return {
      transactionId: t.transactionId,
      orderId: t.orderId,
      customerId: t.customerId,
      paymentMethodConfigId: t.paymentMethodConfigId,
      gatewayId: t.gatewayId,
      externalTransactionId: t.externalTransactionId,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      refundedAmount: t.refundedAmount,
      refundableAmount: t.refundableAmount,
      isPaid: t.isPaid,
      canBeRefunded: t.canBeRefunded,
      authorizedAt: t.authorizedAt?.toISOString(),
      capturedAt: t.capturedAt?.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}

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
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        refundedAmount: t.refundedAmount,
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
