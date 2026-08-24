/**
 * Gateway Webhook Controller
 *
 * Handles inbound payment gateway events for any provider (Stripe, Adyen, …).
 * Provider detection → adapter lookup → signature verification → normalization
 * → provider-agnostic core logic (order + session state transitions).
 *
 * Authenticated by HMAC signature only — no session middleware.
 * Mount with express.raw({ type: 'application/json' }) so rawBody is available.
 */

import { Request, Response } from 'express';
import { logger } from '../../../../libs/logger';
import paymentDataRepository from '../../infrastructure/repositories/PaymentDataRepository';

const PaymentRepo = paymentDataRepository.payments;
import { eventBus } from '../../../../libs/events/eventBus';
import { getAdapter } from '../../application/services/GatewayAdapterRegistry';
import { ProcessPaymentWebhookUseCase, ProcessPaymentWebhookCommand } from '../../application/useCases/ProcessPaymentWebhook';
import { CheckoutOrderStatusSyncAdapter } from '../../infrastructure/acl/CheckoutOrderStatusSyncAdapter';
import type { OrderStatusSyncPort } from '../../application/ports/OrderStatusSyncPort';

// Ports
const orderStatusSyncPort: OrderStatusSyncPort = new CheckoutOrderStatusSyncAdapter();

// ============================================================================
// Helpers
// ============================================================================

/**
 * Detect the provider from the request.
 * Priority: explicit `?provider=` query param → header hints → fallback 'generic'.
 */
function detectProvider(req: Request): string {
  if (req.query.provider) return String(req.query.provider).toLowerCase();
  if (req.headers['stripe-signature']) return 'stripe';
  if (req.headers['x-adyen-hmac-key'] || req.headers['x-adyen-notification']) return 'adyen';
  return 'generic';
}

// ============================================================================
// Handler
// ============================================================================

export async function handleGatewayWebhook(req: Request, res: Response): Promise<void> {
  try {
    const rawBody: Buffer = req.body as Buffer;

  // 1. Detect provider and resolve adapter
  const provider = detectProvider(req);
  const adapter = getAdapter(provider);

  // 2. Look up the webhook secret for this gateway from the DB (or env fallback)
  const gatewayRow = await PaymentRepo.getDefaultGateway('default').catch(() => null);
  const secret: string = (gatewayRow as { webhookSecret?: string } | null)?.webhookSecret || process.env.PAYMENT_WEBHOOK_SECRET || '';

  // 3. Verify signature
  if (secret) {
    const valid = adapter.verifySignature(rawBody, req.headers as Record<string, string | undefined>, secret);
    if (!valid) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }
  } else {
    logger.warning(`[webhook] No webhook secret configured for provider "${provider}" — skipping signature verification`);
  }

  // 4. Parse body
  let rawPayload: Record<string, unknown>;
  try {
    rawPayload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  // 5. Record the raw webhook for audit / idempotency
  const dataObj = rawPayload.data as Record<string, unknown> | undefined;
  const dataObject = dataObj?.object as Record<string, unknown> | undefined;
  const notificationItems = rawPayload.notificationItems as Array<Record<string, unknown>> | undefined;
  const firstNotification = notificationItems?.[0] as Record<string, unknown> | undefined;
  const notificationItem = firstNotification?.NotificationRequestItem as Record<string, unknown> | undefined;

  const externalId: string =
    (dataObject?.id as string) ||
    (rawPayload.externalTransactionId as string) ||
    (notificationItem?.pspReference as string) ||
    '';

  if (externalId) {
    const recordUseCase = new ProcessPaymentWebhookUseCase();
    const recorded = await recordUseCase
      .execute(new ProcessPaymentWebhookCommand(externalId, provider, (rawPayload.type as string) || (rawPayload.eventCode as string) || 'unknown', rawPayload))
      .catch(() => null);

    if (recorded?.alreadyExisted) {
      // Already processed — respond immediately without re-running side effects
      res.status(200).json({ received: true });
      return;
    }
  }

  // 6. Normalize to canonical event
  const event = adapter.normalize(rawPayload);
  if (!event) {
    // Unrecognised event type — silently acknowledge
    res.status(200).json({ received: true });
    return;
  }

  // 7. Look up the internal transaction
  const transaction = await PaymentRepo.findTransactionByExternalId(event.externalTransactionId);
  if (!transaction) {
    res.status(200).json({ received: true });
    return;
  }

  // 8. Dispatch to core handler based on normalized event type
  if (event.type === 'payment_succeeded') {
    if (transaction.status === 'paid') {
      res.status(200).json({ received: true });
      return;
    }

    try {
      transaction.markAsPaid(event.externalTransactionId, event.gatewayResponse);
      await PaymentRepo.saveTransaction(transaction);

      const checkoutSummary = await orderStatusSyncPort.findCheckoutByPaymentIntentId(event.externalTransactionId);
      if (checkoutSummary) {
        const orderInfo = await orderStatusSyncPort.markOrderPaid(checkoutSummary.orderId);

        // Emit events — checkout and order modules handle their own state updates
        // via event subscriptions (Published Language pattern)
        eventBus.emit('order.paid', {
          orderId: checkoutSummary.orderId,
          orderNumber: orderInfo?.orderNumber ?? checkoutSummary.orderNumber,
          customerId: checkoutSummary.customerId,
          totalAmount: checkoutSummary.totalAmount,
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

    res.status(200).json({ received: true });
    return;
  }

  if (event.type === 'payment_failed') {
    if (transaction.status === 'failed') {
      res.status(200).json({ received: true });
      return;
    }

    try {
      transaction.fail(event.errorCode!, event.errorMessage!, event.gatewayResponse);
      await PaymentRepo.saveTransaction(transaction);

      const checkoutSummary = await orderStatusSyncPort.findCheckoutByPaymentIntentId(event.externalTransactionId);
      if (checkoutSummary) {
        // Emit events — order and checkout modules handle their own state updates
        // via event subscriptions (Published Language pattern)
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

    res.status(200).json({ received: true });
    return;
  }

  // Other normalized types (refund_completed, etc.) — acknowledge, handle later
  res.status(200).json({ received: true });
  } catch (error: unknown) {
    logger.error('[webhook] Unhandled error:', error);
    res.status(200).json({ received: true });
  }
}
