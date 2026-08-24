/**
 * Webhook Dispatch Service
 *
 * Listens to the platform eventBus and dispatches matching events
 * to registered webhook endpoints with HMAC signature verification,
 * retry logic, and delivery tracking.
 *
 * Retry processing uses a claim-based polling worker (setTimeout-based,
 * not setInterval) with FOR UPDATE SKIP LOCKED for multi-node safety.
 */

import { createHmac } from 'crypto';
import { logger } from '../../../../libs/logger';
import { generateUUID } from '../../../../libs/uuid';
import { eventBus, EventPayload } from '../../../../libs/events/eventBus';
import { WebhookEndpointEntity } from '../../domain/entities/WebhookEndpoint';
import { WebhookDeliveryEntity } from '../../domain/entities/WebhookDelivery';
import { WebhookRepositoryInterface } from '../../domain/repositories/WebhookRepository';

const RETRY_POLL_INTERVAL_MS = 5_000;
const RETRY_BATCH_SIZE = 20;

export class WebhookDispatchService {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private isPolling = false;
  private shuttingDown = false;
  private readonly nodeId = `${process.pid}-${Date.now()}`;

  constructor(private readonly repo: WebhookRepositoryInterface) {}

  /**
   * Start listening to all events on the eventBus and dispatch to webhooks
   */
  start(): void {
    eventBus.on('*', this.handleEvent.bind(this));
    this.startRetryWorker();
    logger.info('[WEBHOOK] Dispatch service started', { nodeId: this.nodeId });
  }

  /**
   * Stop listening and clean up
   */
  stop(): void {
    this.shuttingDown = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    logger.info('[WEBHOOK] Dispatch service stopped');
  }

  /**
   * Handle an incoming event from the eventBus
   */
  private async handleEvent(payload: EventPayload): Promise<void> {
    try {
      const endpoints = await this.repo.findEndpointsByEvent(payload.type);
      if (endpoints.length === 0) return;

      for (const endpointProps of endpoints) {
        const endpoint = WebhookEndpointEntity.reconstitute(endpointProps);
        if (!endpoint.isActive) continue;

        // Fire and forget — delivery is tracked asynchronously
        this.dispatchToEndpoint(endpoint, payload).catch(err => {
          logger.error(`[WEBHOOK] Dispatch error for endpoint ${endpoint.webhookEndpointId}:`, err);
        });
      }
    } catch (error) {
      logger.error('[WEBHOOK] Error handling event:', error);
    }
  }

  /**
   * Dispatch a single event payload to a webhook endpoint
   */
  private async dispatchToEndpoint(endpoint: WebhookEndpointEntity, payload: EventPayload): Promise<void> {
    const deliveryId = generateUUID();
    const eventId = payload.correlationId || generateUUID();

    const delivery = WebhookDeliveryEntity.create({
      webhookDeliveryId: deliveryId,
      webhookEndpointId: endpoint.webhookEndpointId,
      eventType: payload.type,
      eventId,
      payload: {
        event: payload.type,
        data: payload.data,
        timestamp: payload.timestamp.toISOString(),
        deliveryId,
      },
    });

    // Persist delivery record
    await this.repo.createDelivery({
      webhookDeliveryId: delivery.webhookDeliveryId,
      webhookEndpointId: delivery.webhookEndpointId,
      eventType: delivery.eventType,
      eventId: delivery.eventId,
      payload: delivery.payload,
      status: delivery.status,
      attempts: delivery.attempts,
      lastAttemptAt: delivery.lastAttemptAt,
      nextRetryAt: delivery.nextRetryAt,
      responseStatus: delivery.responseStatus,
      responseBody: delivery.responseBody,
      errorMessage: delivery.errorMessage,
      duration: delivery.duration,
    });

    // Attempt delivery
    await this.attemptDelivery(delivery, endpoint);
  }

  /**
   * Attempt to deliver a webhook payload
   */
  private async attemptDelivery(delivery: WebhookDeliveryEntity, endpoint: WebhookEndpointEntity): Promise<void> {
    const bodyStr = JSON.stringify(delivery.payload);
    const signature = this.signPayload(bodyStr, endpoint.secret);
    const startTime = Date.now();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': delivery.eventType,
      'X-Webhook-Delivery-Id': delivery.webhookDeliveryId,
      'X-Webhook-Timestamp': new Date().toISOString(),
      ...(endpoint.headers || {}),
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: bodyStr,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const durationMs = Date.now() - startTime;
      const responseBody = await response.text();

      if (response.ok) {
        delivery.recordSuccess(response.status, responseBody, durationMs);
      } else {
        delivery.recordFailure(
          `HTTP ${response.status}`,
          response.status,
          responseBody,
          durationMs,
          endpoint.retryPolicy.maxRetries,
          endpoint.retryPolicy.retryIntervalMs,
          endpoint.retryPolicy.backoffMultiplier,
        );
      }
    } catch (error: unknown) {
      const durationMs = Date.now() - startTime;
      delivery.recordFailure(
        (error as Error).message || 'Network error',
        null,
        null,
        durationMs,
        endpoint.retryPolicy.maxRetries,
        endpoint.retryPolicy.retryIntervalMs,
        endpoint.retryPolicy.backoffMultiplier,
      );
    }

    // Persist delivery result
    await this.repo.updateDelivery(delivery.webhookDeliveryId, {
      status: delivery.status,
      attempts: delivery.attempts,
      lastAttemptAt: delivery.lastAttemptAt,
      nextRetryAt: delivery.nextRetryAt,
      responseStatus: delivery.responseStatus,
      responseBody: delivery.responseBody,
      errorMessage: delivery.errorMessage,
      duration: delivery.duration,
    });
  }

  /**
   * Process pending retries using claim-based locking.
   * Multi-node safe via FOR UPDATE SKIP LOCKED.
   */
  private async processRetries(): Promise<void> {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const claimedDeliveries = await this.repo.claimPendingRetries(this.nodeId, RETRY_BATCH_SIZE);
      if (claimedDeliveries.length === 0) return;

      logger.info(`[WEBHOOK] Claimed ${claimedDeliveries.length} pending retries`, { nodeId: this.nodeId });

      for (const deliveryProps of claimedDeliveries) {
        const delivery = WebhookDeliveryEntity.reconstitute(deliveryProps);
        const endpointProps = await this.repo.findEndpointById(delivery.webhookEndpointId);

        if (!endpointProps || !endpointProps.isActive) {
          // Mark as failed if endpoint no longer exists or is inactive
          await this.repo.updateDelivery(delivery.webhookDeliveryId, {
            status: 'failed',
            errorMessage: 'Endpoint no longer active',
            nextRetryAt: null,
          });
          await this.repo.releaseDeliveryLock(delivery.webhookDeliveryId);
          continue;
        }

        const endpoint = WebhookEndpointEntity.reconstitute(endpointProps);
        await this.attemptDelivery(delivery, endpoint);
        await this.repo.releaseDeliveryLock(delivery.webhookDeliveryId);
      }
    } catch (error) {
      logger.error('[WEBHOOK] Error processing retries:', error);
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Start the claim-based retry worker.
   * Uses setTimeout (not setInterval) with .unref() so:
   * - The process can exit gracefully without the timer blocking
   * - The next poll only schedules after the current batch completes
   * - Multi-node safe via FOR UPDATE SKIP LOCKED in claimPendingRetries()
   */
  private startRetryWorker(): void {
    const poll = async () => {
      if (this.shuttingDown) return;

      try {
        await this.processRetries();
      } catch (err: unknown) {
        logger.error('[WEBHOOK] Retry worker error:', err);
      }

      if (!this.shuttingDown) {
        this.retryTimer = setTimeout(poll, RETRY_POLL_INTERVAL_MS);
        this.retryTimer.unref();
      }
    };

    poll();
  }

  /**
   * Create HMAC-SHA256 signature for payload verification
   */
  private signPayload(body: string, secret: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
  }
}
