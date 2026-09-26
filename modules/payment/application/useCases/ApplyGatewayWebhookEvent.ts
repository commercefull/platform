/**
 * ApplyGatewayWebhookEvent Use Case
 *
 * Applies a verified inbound gateway webhook to internal state:
 * records the webhook for idempotency → normalizes the payload →
 * transitions the payment transaction → syncs order/checkout state →
 * emits domain events (order.paid, checkout.payment_captured, …).
 *
 * Signature verification and provider detection stay in the interface
 * layer; this use case assumes the payload is authentic.
 *
 * Every outcome resolves without throwing — gateway webhooks must always
 * be acknowledged so the provider does not retry indefinitely.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';
import type { PaymentTransaction } from '../../domain/entities/PaymentTransaction';
import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';
import type { WebhookEvent } from '../../infrastructure/services/GatewayAdapter';
import type { GatewayWebhookPort } from '../ports/GatewayWebhookPort';
import type { OrderStatusSyncPort } from '../ports/OrderStatusSyncPort';
import { ProcessPaymentWebhookCommand, ProcessPaymentWebhookUseCase } from './ProcessPaymentWebhook';

export class ApplyGatewayWebhookEventUseCase {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly gatewayWebhooks: GatewayWebhookPort,
    private readonly orderStatusSync: OrderStatusSyncPort,
    private readonly recordWebhook: ProcessPaymentWebhookUseCase,
  ) {}

  async execute(provider: string, rawPayload: Record<string, unknown>): Promise<void> {
    // 1. Record the raw webhook for audit / idempotency
    const externalId = this.extractExternalId(rawPayload);
    if (externalId) {
      const recorded = await this.recordWebhook
        .execute(
          new ProcessPaymentWebhookCommand(
            externalId,
            provider,
            (rawPayload.type as string) || (rawPayload.eventCode as string) || 'unknown',
            rawPayload,
          ),
        )
        .catch(() => null);

      if (recorded?.alreadyExisted) {
        // Already processed — acknowledge without re-running side effects
        return;
      }
    }

    // 2. Normalize to canonical event
    const event = this.gatewayWebhooks.normalize(provider, rawPayload);
    if (!event) return;

    // 3. Look up the internal transaction
    const transaction = await this.payments.findTransactionByExternalId(event.externalTransactionId);
    if (!transaction) return;

    // 4. Dispatch on normalized event type
    if (event.type === 'payment_succeeded') {
      await this.handlePaymentSucceeded(event, transaction);
    } else if (event.type === 'payment_failed') {
      await this.handlePaymentFailed(event, transaction);
    }
    // Other normalized types (refund_completed, etc.) — acknowledge, handle later
  }

  private extractExternalId(rawPayload: Record<string, unknown>): string {
    const dataObj = rawPayload.data as Record<string, unknown> | undefined;
    const dataObject = dataObj?.object as Record<string, unknown> | undefined;
    const notificationItems = rawPayload.notificationItems as Array<Record<string, unknown>> | undefined;
    const firstNotification = notificationItems?.[0] as Record<string, unknown> | undefined;
    const notificationItem = firstNotification?.NotificationRequestItem as Record<string, unknown> | undefined;

    return (
      (dataObject?.id as string) ||
      (rawPayload.externalTransactionId as string) ||
      (notificationItem?.pspReference as string) ||
      ''
    );
  }

  private async handlePaymentSucceeded(event: WebhookEvent, transaction: PaymentTransaction): Promise<void> {
    if (transaction.status === 'paid') return;

    try {
      transaction.markAsPaid(event.externalTransactionId, event.gatewayResponse);
      await this.payments.saveTransaction(transaction);

      const checkoutSummary = await this.orderStatusSync.findCheckoutByPaymentIntentId(event.externalTransactionId);
      if (checkoutSummary) {
        const orderInfo = await this.orderStatusSync.markOrderPaid(checkoutSummary.orderId);

        // Order and checkout modules handle their own state updates via
        // event subscriptions (Published Language pattern)
        eventBus.emit('order.paid', {
          orderId: checkoutSummary.orderId,
          orderNumber: orderInfo?.orderNumber ?? checkoutSummary.orderNumber,
          customerId: checkoutSummary.customerId,
          totalAmountCents: checkoutSummary.totalAmountCents,
          amountCents: checkoutSummary.totalAmountCents,
        });

        eventBus.emit('checkout.payment_captured', {
          checkoutId: checkoutSummary.checkoutId,
          orderId: checkoutSummary.orderId,
          paymentIntentId: event.externalTransactionId,
        });
      }
    } catch (err: unknown) {
      logger.error('[webhook] payment_succeeded handler error:', err);
    }
  }

  private async handlePaymentFailed(event: WebhookEvent, transaction: PaymentTransaction): Promise<void> {
    if (transaction.status === 'failed') return;

    try {
      transaction.fail(event.errorCode!, event.errorMessage!, event.gatewayResponse);
      await this.payments.saveTransaction(transaction);

      const checkoutSummary = await this.orderStatusSync.findCheckoutByPaymentIntentId(event.externalTransactionId);
      if (checkoutSummary) {
        eventBus.emit('order.payment_failed', {
          orderId: checkoutSummary.orderId,
          customerId: checkoutSummary.customerId,
          reason: event.errorMessage,
        });

        eventBus.emit('checkout.failed', {
          checkoutId: checkoutSummary.checkoutId,
          orderId: checkoutSummary.orderId,
          reason: event.errorMessage,
        });
      }
    } catch (err: unknown) {
      logger.error('[webhook] payment_failed handler error:', err);
    }
  }
}
