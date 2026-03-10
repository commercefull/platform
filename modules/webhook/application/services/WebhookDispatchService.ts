/**
 * Webhook Dispatch Service
 *
 * Listens to the platform eventBus and dispatches matching events
 * to registered webhook endpoints with HMAC signature verification,
 * retry logic, and delivery tracking.
 */

import { createHmac } from 'crypto';
import { logger } from '../../../../libs/logger';
import { generateUUID } from '../../../../libs/uuid';
import { eventBus, EventPayload } from '../../../../libs/events/eventBus';
import { WebhookEndpointEntity } from '../../domain/entities/WebhookEndpoint';
import { WebhookDeliveryEntity } from '../../domain/entities/WebhookDelivery';
import { WebhookRepositoryInterface } from '../../domain/repositories/WebhookRepository';

export class WebhookDispatchService {
  private retryTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly repo: WebhookRepositoryInterface) {}

  /**
   * Start listening to all events on the eventBus and dispatch to webhooks
   */
  start(): void {
    eventBus.on('*', this.handleEvent.bind(this));
    this.startRetryLoop();
    logger.info('[WEBHOOK] Dispatch service started');
  }

  /**
   * Stop listening and clean up
   */
  stop(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
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
  private async dispatchToEndpoint(
    endpoint: WebhookEndpointEntity,
    payload: EventPayload,
  ): Promise<void> {
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
  private async attemptDelivery(
    delivery: WebhookDeliveryEntity,
    endpoint: WebhookEndpointEntity,
  ): Promise<void> {
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
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      delivery.recordFailure(
        error.message || 'Network error',
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
   * Process pending retries
   */
  private async processRetries(): Promise<void> {
    try {
      const pendingDeliveries = await this.repo.findPendingRetries();
      if (pendingDeliveries.length === 0) return;

      logger.info(`[WEBHOOK] Processing ${pendingDeliveries.length} pending retries`);

      for (const deliveryProps of pendingDeliveries) {
        const delivery = WebhookDeliveryEntity.reconstitute(deliveryProps);
        const endpointProps = await this.repo.findEndpointById(delivery.webhookEndpointId);

        if (!endpointProps || !endpointProps.isActive) {
          // Mark as failed if endpoint no longer exists or is inactive
          await this.repo.updateDelivery(delivery.webhookDeliveryId, {
            status: 'failed',
            errorMessage: 'Endpoint no longer active',
            nextRetryAt: null,
          });
          continue;
        }

        const endpoint = WebhookEndpointEntity.reconstitute(endpointProps);
        await this.attemptDelivery(delivery, endpoint);
      }
    } catch (error) {
      logger.error('[WEBHOOK] Error processing retries:', error);
    }
  }

  /**
   * Start the retry processing loop (runs every 30 seconds)
   */
  private startRetryLoop(): void {
    this.retryTimer = setInterval(() => {
      this.processRetries().catch(err => {
        logger.error('[WEBHOOK] Retry loop error:', err);
      });
    }, 30000);
  }

  /**
   * Create HMAC-SHA256 signature for payload verification
   */
  private signPayload(body: string, secret: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
  }
}
