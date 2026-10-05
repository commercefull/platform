/**
 * ChargeDelegatedPayment Use Case
 *
 * Charges a delegated credential (e.g. a Stripe Shared Payment Token issued
 * by an agentic surface) synchronously against the routed PSP, then applies
 * the same state transitions the gateway-webhook path applies:
 * transaction → paid, order → processing/paid, `order.paid` +
 * `checkout.payment_captured` events.
 *
 * Raw card data never enters Commercefull — `credential.token` is an opaque
 * PSP-scoped token, passed straight through to `paymentMethodToken`.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import type { OrderStatusSyncPort } from '../ports/OrderStatusSyncPort';
import type { RoutePaymentUseCase } from './RoutePayment';
import { RoutePaymentCommand } from './RoutePayment';
import { TransactionNotFoundError, InvalidStatusTransitionError, ChargeDelegatedPaymentError } from '../../domain/errors/PaymentErrors';
import { logger } from '../../../../libs/logger';

export interface DelegatedCredential {
  /** Payment handler id the surface used (e.g. 'stripe') */
  provider: string;
  /** Credential flavor (e.g. 'spt') — recorded in transaction metadata */
  credentialType: string;
  /** Opaque PSP-scoped token — never raw PAN data */
  token: string;
}

export class ChargeDelegatedPaymentCommand {
  constructor(
    public readonly organizationId: string,
    public readonly orderId: string,
    public readonly transactionId: string,
    public readonly amountCents: number,
    public readonly currency: string,
    public readonly credential: DelegatedCredential,
    public readonly customerId?: string,
    public readonly customerEmail?: string,
    public readonly customerIp?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}

export interface ChargeDelegatedPaymentResponse {
  transactionId: string;
  externalTransactionId: string;
  provider: string;
  status: 'paid';
}

export class ChargeDelegatedPaymentUseCase {
  constructor(
    private readonly payments: Pick<PaymentRepository, 'findTransactionById' | 'saveTransaction'>,
    private readonly routePayment: Pick<RoutePaymentUseCase, 'execute'>,
    private readonly orderStatusSync: Pick<OrderStatusSyncPort, 'findCheckoutByPaymentIntentId' | 'markOrderPaid'>,
  ) {}

  async execute(command: ChargeDelegatedPaymentCommand): Promise<ChargeDelegatedPaymentResponse> {
    const transaction = await this.payments.findTransactionById(command.transactionId);
    if (!transaction) {
      throw new TransactionNotFoundError(command.transactionId);
    }
    if (transaction.isPaid) {
      // Idempotent replay — a previous charge already succeeded
      return {
        transactionId: transaction.transactionId,
        externalTransactionId: transaction.externalTransactionId ?? '',
        provider: command.credential.provider,
        status: 'paid',
      };
    }
    if (!transaction.isPending) {
      throw new InvalidStatusTransitionError(transaction.status, 'paid');
    }

    let result;
    try {
      result = await this.routePayment.execute(
        new RoutePaymentCommand(
          command.organizationId,
          command.orderId,
          command.amountCents,
          command.currency,
          command.customerId,
          command.customerEmail,
          command.customerIp,
          command.credential.token,
          `Delegated ${command.credential.credentialType} charge via ${command.credential.provider}`,
          undefined,
          undefined,
          {
            ...command.metadata,
            delegatedCredentialType: command.credential.credentialType,
            delegatedProvider: command.credential.provider,
          },
        ),
      );
    } catch (err) {
      transaction.fail('delegated_charge_failed', err instanceof Error ? err.message : 'Routed PSP charge failed');
      await this.payments.saveTransaction(transaction);
      throw new ChargeDelegatedPaymentError(err instanceof Error ? err.message : 'routed PSP charge failed');
    }

    if (!result.success || (result.status !== 'captured' && result.status !== 'authorized')) {
      transaction.fail('delegated_charge_failed', `Charge declined by routed PSP (status: ${result.status})`);
      await this.payments.saveTransaction(transaction);
      throw new ChargeDelegatedPaymentError(`routed PSP returned status ${result.status}`);
    }

    transaction.markAsPaid(result.externalTransactionId, {
      provider: result.provider,
      routedAttempts: result.attempts.length,
      delegatedCredentialType: command.credential.credentialType,
    });
    await this.payments.saveTransaction(transaction);

    // Same Published-Language events as the PSP webhook success path:
    // order.paid → fulfillment/notification/tracking, checkout.payment_captured →
    // checkout session transitions to 'processing' so CompleteCheckout can finish.
    const checkoutSummary = await this.orderStatusSync.findCheckoutByPaymentIntentId(command.transactionId);
    const orderInfo = await this.orderStatusSync.markOrderPaid(command.orderId);

    eventBus.emit('order.paid', {
      orderId: command.orderId,
      orderNumber: orderInfo?.orderNumber ?? checkoutSummary?.orderNumber,
      customerId: command.customerId ?? checkoutSummary?.customerId,
      totalAmountCents: command.amountCents,
      amountCents: command.amountCents,
    });

    if (checkoutSummary) {
      eventBus.emit('checkout.payment_captured', {
        checkoutId: checkoutSummary.checkoutId,
        orderId: command.orderId,
        paymentIntentId: command.transactionId,
      });
    }

    logger.info('Delegated payment charged', {
      transactionId: command.transactionId,
      orderId: command.orderId,
      provider: result.provider,
    });

    return {
      transactionId: transaction.transactionId,
      externalTransactionId: result.externalTransactionId,
      provider: result.provider,
      status: 'paid',
    };
  }
}
