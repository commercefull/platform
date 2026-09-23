import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import { TransactionIdOrExternalIdRequiredError } from '../../domain/errors/PaymentErrors';

export class GetTransactionCommand {
  constructor(
    public readonly transactionId?: string,
    public readonly externalId?: string,
  ) {
    if (!transactionId && !externalId) {
      throw new TransactionIdOrExternalIdRequiredError();
    }
  }
}


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

