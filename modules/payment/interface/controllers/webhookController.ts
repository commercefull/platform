/**
 * Gateway Webhook Controller
 *
 * Handles inbound payment gateway events for any provider (Stripe, Adyen, …).
 * Provider detection → adapter lookup → signature verification → JSON parse
 * → delegates to ApplyGatewayWebhookEventUseCase for provider-agnostic
 * core logic (order + session state transitions).
 *
 * Authenticated by HMAC signature only — no session middleware.
 * Mount with express.raw({ type: 'application/json' }) so rawBody is available.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
import type { GatewayWebhookPort } from '../../application/ports/GatewayWebhookPort';
import { gatewayWebhookPort } from '../../application/wired';
import { applyGatewayWebhookEventUseCase, managePaymentRecordsUseCase } from '../../application/useCases/wired';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Detect the provider from the request.
 * Priority: explicit `?provider=` query param → header hints → fallback 'generic'.
 */
function detectProvider(req: HttpRequest): string {
  if (req.query.provider) return String(req.query.provider).toLowerCase();
  if (req.headers['stripe-signature']) return 'stripe';
  if (req.headers['x-adyen-hmac-key'] || req.headers['x-adyen-notification']) return 'adyen';
  return 'generic';
}

// ============================================================================
// Handler
// ============================================================================

export async function handleGatewayWebhook(req: HttpRequest, res: HttpResponse): Promise<void> {
  try {
    const rawBody: Buffer = req.body as Buffer;

    // 1. Detect provider
    const provider = detectProvider(req);
    const gatewayWebhooks: GatewayWebhookPort = gatewayWebhookPort;

    // 2. Look up the webhook secret for this gateway from the DB (or env fallback)
    const gatewayRow = await managePaymentRecordsUseCase.getDefaultGateway('default').catch(() => null);
    const secret: string = (gatewayRow as { webhookSecret?: string } | null)?.webhookSecret || process.env.PAYMENT_WEBHOOK_SECRET || '';

    // 3. Verify signature
    if (secret) {
      const valid = gatewayWebhooks.verifySignature(provider, rawBody, req.headers as Record<string, string | undefined>, secret);
      if (!valid) {
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }
    } else {
      logger.warn(`[webhook] No webhook secret configured for provider "${provider}" — skipping signature verification`);
    }

    // 4. Parse body
    let rawPayload: Record<string, unknown>;
    try {
      rawPayload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }

    // 5. Apply the event — recording, normalization, transaction state,
    //    order/checkout sync, and event emission all live in the use case.
    //    It never throws; every outcome acknowledges the webhook.
    await applyGatewayWebhookEventUseCase.execute(provider, rawPayload);

    res.status(200).json({ received: true });
  } catch (error: unknown) {
    logger.error('[webhook] Unhandled error:', error);
    res.status(200).json({ received: true });
  }
}
