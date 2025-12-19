/**
 * Webhook Service
 * Provides event-driven integrations with external systems
 * for the CommerceFull platform - Phase 8
 */

import { query, queryOne } from '../../../libs/db';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface WebhookEndpoint {
  webhookEndpointId: string;
  merchantId?: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  headers?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  webhookDeliveryId: string;
  webhookEndpointId: string;
  eventType: string;
  eventId: string;
  payload: Record<string, any>;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  eventType: string;
  eventId: string;
  payload: Record<string, any>;
  timestamp: Date;
}

// ============================================================================
// Webhook Endpoint Management
// ============================================================================

export async function createWebhookEndpoint(input: {
  merchantId?: string;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  retryPolicy?: Partial<WebhookEndpoint['retryPolicy']>;
}): Promise<WebhookEndpoint> {
  const webhookEndpointId = uuidv4();
  const secret = generateWebhookSecret();
  const now = new Date();

  const retryPolicy = {
    maxRetries: input.retryPolicy?.maxRetries ?? 3,
    retryDelayMs: input.retryPolicy?.retryDelayMs ?? 5000,
    backoffMultiplier: input.retryPolicy?.backoffMultiplier ?? 2
  };

  await query(
    `INSERT INTO "webhookEndpoint" (
      "webhookEndpointId", "merchantId", "name", "url", "secret",
      "events", "isActive", "headers", "retryPolicy", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      webhookEndpointId,
      input.merchantId || null,
      input.name,
      input.url,
      secret,
      JSON.stringify(input.events),
      true,
      input.headers ? JSON.stringify(input.headers) : null,
      JSON.stringify(retryPolicy),
      now,
      now
    ]
  );

  return {
    webhookEndpointId,
    merchantId: input.merchantId,
    name: input.name,
    url: input.url,
    secret,
    events: input.events,
    isActive: true,
    headers: input.headers,
    retryPolicy,
    createdAt: now,
    updatedAt: now
  };
}

export async function updateWebhookEndpoint(
  webhookEndpointId: string,
  updates: Partial<{
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    headers: Record<string, string>;
    retryPolicy: Partial<WebhookEndpoint['retryPolicy']>;
  }>
): Promise<WebhookEndpoint | null> {
  const existing = await getWebhookEndpoint(webhookEndpointId);
  if (!existing) return null;

  const now = new Date();
  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`"name" = $${paramIndex++}`);
    params.push(updates.name);
  }

  if (updates.url !== undefined) {
    setClauses.push(`"url" = $${paramIndex++}`);
    params.push(updates.url);
  }

  if (updates.events !== undefined) {
    setClauses.push(`"events" = $${paramIndex++}`);
    params.push(JSON.stringify(updates.events));
  }

  if (updates.isActive !== undefined) {
    setClauses.push(`"isActive" = $${paramIndex++}`);
    params.push(updates.isActive);
  }

  if (updates.headers !== undefined) {
    setClauses.push(`"headers" = $${paramIndex++}`);
    params.push(JSON.stringify(updates.headers));
  }

  if (updates.retryPolicy !== undefined) {
    const newRetryPolicy = { ...existing.retryPolicy, ...updates.retryPolicy };
    setClauses.push(`"retryPolicy" = $${paramIndex++}`);
    params.push(JSON.stringify(newRetryPolicy));
  }

  setClauses.push(`"updatedAt" = $${paramIndex++}`);
  params.push(now);

  params.push(webhookEndpointId);

  await query(
    `UPDATE "webhookEndpoint" SET ${setClauses.join(', ')} WHERE "webhookEndpointId" = $${paramIndex}`,
    params
  );

  return getWebhookEndpoint(webhookEndpointId);
}

export async function deleteWebhookEndpoint(webhookEndpointId: string): Promise<boolean> {
  await query(
    `DELETE FROM "webhookEndpoint" WHERE "webhookEndpointId" = $1`,
    [webhookEndpointId]
  );
  return true;
}

export async function getWebhookEndpoint(webhookEndpointId: string): Promise<WebhookEndpoint | null> {
  const row = await queryOne<any>(
    `SELECT * FROM "webhookEndpoint" WHERE "webhookEndpointId" = $1`,
    [webhookEndpointId]
  );

  return row ? mapToWebhookEndpoint(row) : null;
}

export async function getWebhookEndpoints(merchantId?: string): Promise<WebhookEndpoint[]> {
  const rows = await query<Array<any>>(
    merchantId
      ? `SELECT * FROM "webhookEndpoint" WHERE "merchantId" = $1 ORDER BY "createdAt" DESC`
      : `SELECT * FROM "webhookEndpoint" ORDER BY "createdAt" DESC`,
    merchantId ? [merchantId] : []
  );

  return (rows || []).map(mapToWebhookEndpoint);
}

export async function getWebhookEndpointsForEvent(eventType: string): Promise<WebhookEndpoint[]> {
  const rows = await query<Array<any>>(
    `SELECT * FROM "webhookEndpoint"
     WHERE "isActive" = true AND "events" @> $1::jsonb`,
    [JSON.stringify([eventType])]
  );

  return (rows || []).map(mapToWebhookEndpoint);
}

export async function regenerateWebhookSecret(webhookEndpointId: string): Promise<string | null> {
  const newSecret = generateWebhookSecret();
  const now = new Date();

  await query(
    `UPDATE "webhookEndpoint" SET "secret" = $1, "updatedAt" = $2 WHERE "webhookEndpointId" = $3`,
    [newSecret, now, webhookEndpointId]
  );

  return newSecret;
}

// ============================================================================
// Webhook Event Dispatch
// ============================================================================

export async function dispatchWebhookEvent(event: WebhookEvent): Promise<WebhookDelivery[]> {
  const endpoints = await getWebhookEndpointsForEvent(event.eventType);
  const deliveries: WebhookDelivery[] = [];

  for (const endpoint of endpoints) {
    const delivery = await createWebhookDelivery(endpoint, event);
    deliveries.push(delivery);

    // Attempt immediate delivery (in production, this would be queued)
    attemptWebhookDelivery(delivery.webhookDeliveryId).catch(console.error);
  }

  return deliveries;
}

async function createWebhookDelivery(
  endpoint: WebhookEndpoint,
  event: WebhookEvent
): Promise<WebhookDelivery> {
  const webhookDeliveryId = uuidv4();
  const now = new Date();

  await query(
    `INSERT INTO "webhookDelivery" (
      "webhookDeliveryId", "webhookEndpointId", "eventType", "eventId",
      "payload", "status", "attempts", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      webhookDeliveryId,
      endpoint.webhookEndpointId,
      event.eventType,
      event.eventId,
      JSON.stringify(event.payload),
      'pending',
      0,
      now,
      now
    ]
  );

  return {
    webhookDeliveryId,
    webhookEndpointId: endpoint.webhookEndpointId,
    eventType: event.eventType,
    eventId: event.eventId,
    payload: event.payload,
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now
  };
}

export async function attemptWebhookDelivery(webhookDeliveryId: string): Promise<boolean> {
  const delivery = await getWebhookDelivery(webhookDeliveryId);
  if (!delivery) return false;

  const endpoint = await getWebhookEndpoint(delivery.webhookEndpointId);
  if (!endpoint) return false;

  const now = new Date();
  const startTime = Date.now();

  try {
    // Generate signature
    const signature = generateWebhookSignature(delivery.payload, endpoint.secret);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': delivery.eventType,
      'X-Webhook-Delivery-Id': webhookDeliveryId,
      'X-Webhook-Timestamp': now.toISOString(),
      ...(endpoint.headers || {})
    };

    // Make HTTP request (simplified - in production use proper HTTP client)
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(delivery.payload)
    });

    const duration = Date.now() - startTime;
    const responseBody = await response.text();

    if (response.ok) {
      // Success
      await updateWebhookDeliveryStatus(webhookDeliveryId, {
        status: 'success',
        attempts: delivery.attempts + 1,
        lastAttemptAt: now,
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000),
        duration
      });
      return true;
    } else {
      // Failed - schedule retry if applicable
      await handleDeliveryFailure(delivery, endpoint, {
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000),
        duration
      });
      return false;
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    await handleDeliveryFailure(delivery, endpoint, {
      errorMessage: error.message,
      duration
    });
    return false;
  }
}

async function handleDeliveryFailure(
  delivery: WebhookDelivery,
  endpoint: WebhookEndpoint,
  result: {
    responseStatus?: number;
    responseBody?: string;
    errorMessage?: string;
    duration?: number;
  }
): Promise<void> {
  const now = new Date();
  const attempts = delivery.attempts + 1;

  if (attempts < endpoint.retryPolicy.maxRetries) {
    // Schedule retry with exponential backoff
    const delay = endpoint.retryPolicy.retryDelayMs * Math.pow(endpoint.retryPolicy.backoffMultiplier, attempts - 1);
    const nextRetryAt = new Date(now.getTime() + delay);

    await updateWebhookDeliveryStatus(delivery.webhookDeliveryId, {
      status: 'retrying',
      attempts,
      lastAttemptAt: now,
      nextRetryAt,
      ...result
    });
  } else {
    // Max retries exceeded
    await updateWebhookDeliveryStatus(delivery.webhookDeliveryId, {
      status: 'failed',
      attempts,
      lastAttemptAt: now,
      ...result
    });
  }
}

async function updateWebhookDeliveryStatus(
  webhookDeliveryId: string,
  updates: Partial<WebhookDelivery>
): Promise<void> {
  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (updates.status !== undefined) {
    setClauses.push(`"status" = $${paramIndex++}`);
    params.push(updates.status);
  }

  if (updates.attempts !== undefined) {
    setClauses.push(`"attempts" = $${paramIndex++}`);
    params.push(updates.attempts);
  }

  if (updates.lastAttemptAt !== undefined) {
    setClauses.push(`"lastAttemptAt" = $${paramIndex++}`);
    params.push(updates.lastAttemptAt);
  }

  if (updates.nextRetryAt !== undefined) {
    setClauses.push(`"nextRetryAt" = $${paramIndex++}`);
    params.push(updates.nextRetryAt);
  }

  if (updates.responseStatus !== undefined) {
    setClauses.push(`"responseStatus" = $${paramIndex++}`);
    params.push(updates.responseStatus);
  }

  if (updates.responseBody !== undefined) {
    setClauses.push(`"responseBody" = $${paramIndex++}`);
    params.push(updates.responseBody);
  }

  if (updates.errorMessage !== undefined) {
    setClauses.push(`"errorMessage" = $${paramIndex++}`);
    params.push(updates.errorMessage);
  }

  if (updates.duration !== undefined) {
    setClauses.push(`"duration" = $${paramIndex++}`);
    params.push(updates.duration);
  }

  setClauses.push(`"updatedAt" = $${paramIndex++}`);
  params.push(new Date());

  params.push(webhookDeliveryId);

  await query(
    `UPDATE "webhookDelivery" SET ${setClauses.join(', ')} WHERE "webhookDeliveryId" = $${paramIndex}`,
    params
  );
}

// ============================================================================
// Webhook Delivery Retrieval
// ============================================================================

export async function getWebhookDelivery(webhookDeliveryId: string): Promise<WebhookDelivery | null> {
  const row = await queryOne<any>(
    `SELECT * FROM "webhookDelivery" WHERE "webhookDeliveryId" = $1`,
    [webhookDeliveryId]
  );

  return row ? mapToWebhookDelivery(row) : null;
}

export async function getWebhookDeliveries(
  webhookEndpointId: string,
  pagination: { limit?: number; offset?: number } = {}
): Promise<{ data: WebhookDelivery[]; total: number }> {
  const limit = pagination.limit || 50;
  const offset = pagination.offset || 0;

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "webhookDelivery" WHERE "webhookEndpointId" = $1`,
    [webhookEndpointId]
  );

  const rows = await query<Array<any>>(
    `SELECT * FROM "webhookDelivery"
     WHERE "webhookEndpointId" = $1
     ORDER BY "createdAt" DESC
     LIMIT $2 OFFSET $3`,
    [webhookEndpointId, limit, offset]
  );

  return {
    data: (rows || []).map(mapToWebhookDelivery),
    total: parseInt(countResult?.count || '0')
  };
}

export async function getPendingRetries(): Promise<WebhookDelivery[]> {
  const now = new Date();

  const rows = await query<Array<any>>(
    `SELECT * FROM "webhookDelivery"
     WHERE "status" = 'retrying' AND "nextRetryAt" <= $1
     ORDER BY "nextRetryAt" ASC
     LIMIT 100`,
    [now]
  );

  return (rows || []).map(mapToWebhookDelivery);
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

function generateWebhookSignature(payload: any, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  toleranceSeconds: number = 300
): boolean {
  try {
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) return false;

    const timestamp = parseInt(timestampPart.substring(2));
    const expectedSignature = signaturePart.substring(3);

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) return false;

    // Verify signature
    const signedPayload = `${timestamp}.${payload}`;
    const computedSignature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(computedSignature));
  } catch {
    return false;
  }
}

function mapToWebhookEndpoint(row: any): WebhookEndpoint {
  return {
    webhookEndpointId: row.webhookEndpointId,
    merchantId: row.merchantId,
    name: row.name,
    url: row.url,
    secret: row.secret,
    events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events,
    isActive: row.isActive,
    headers: row.headers ? (typeof row.headers === 'string' ? JSON.parse(row.headers) : row.headers) : undefined,
    retryPolicy: typeof row.retryPolicy === 'string' ? JSON.parse(row.retryPolicy) : row.retryPolicy,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToWebhookDelivery(row: any): WebhookDelivery {
  return {
    webhookDeliveryId: row.webhookDeliveryId,
    webhookEndpointId: row.webhookEndpointId,
    eventType: row.eventType,
    eventId: row.eventId,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
    status: row.status,
    attempts: row.attempts,
    lastAttemptAt: row.lastAttemptAt ? new Date(row.lastAttemptAt) : undefined,
    nextRetryAt: row.nextRetryAt ? new Date(row.nextRetryAt) : undefined,
    responseStatus: row.responseStatus,
    responseBody: row.responseBody,
    errorMessage: row.errorMessage,
    duration: row.duration,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

// ============================================================================
// Supported Events
// ============================================================================

export const WEBHOOK_EVENTS = {
  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_REFUNDED: 'order.refunded',

  // Customer Events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',

  // Product Events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_OUT_OF_STOCK: 'product.out_of_stock',
  PRODUCT_BACK_IN_STOCK: 'product.back_in_stock',

  // Inventory Events
  INVENTORY_LOW: 'inventory.low',
  INVENTORY_UPDATED: 'inventory.updated',

  // Payment Events
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Subscription Events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_PAUSED: 'subscription.paused',

  // Fulfillment Events
  FULFILLMENT_CREATED: 'fulfillment.created',
  FULFILLMENT_SHIPPED: 'fulfillment.shipped',
  FULFILLMENT_DELIVERED: 'fulfillment.delivered'
} as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];
