/**
 * Initiate Payment Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class InitiatePaymentCommand {
  constructor(
    public readonly orderId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly paymentMethodConfigId: string,
    public readonly customerId?: string,
    public readonly customerIp?: string,
    public readonly metadata?: Record<string, any>
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface InitiatePaymentResponse {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class InitiatePaymentUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(command: InitiatePaymentCommand): Promise<InitiatePaymentResponse> {
    if (command.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    // Get default gateway
    const gateway = await this.paymentRepository.getDefaultGateway('default');
    if (!gateway) {
      throw new Error('No payment gateway configured');
    }

    const transactionId = generateUUID();

    const transaction = PaymentTransaction.create({
      transactionId,
      orderId: command.orderId,
      customerId: command.customerId,
      paymentMethodConfigId: command.paymentMethodConfigId,
      gatewayId: gateway.gatewayId,
      amount: command.amount,
      currency: command.currency,
      customerIp: command.customerIp,
      metadata: command.metadata
    });

    await this.paymentRepository.saveTransaction(transaction);

    // Emit event
    eventBus.emit('payment.received', {
      transactionId: transaction.transactionId,
      orderId: transaction.orderId,
      amount: transaction.amount,
      currency: transaction.currency
    });

    return {
      transactionId: transaction.transactionId,
      orderId: transaction.orderId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      createdAt: transaction.createdAt.toISOString()
    };
  }
}
