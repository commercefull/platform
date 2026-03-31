/**
 * Webhook Repository Implementation
 *
 * SQL-based persistence for webhook endpoints and deliveries.
 */

import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { WebhookEndpointProps } from '../../domain/entities/WebhookEndpoint';
import { WebhookDeliveryProps, DeliveryStatus } from '../../domain/entities/WebhookDelivery';
import {
  WebhookRepositoryInterface,
  WebhookEndpointFilters,
  WebhookDeliveryFilters,
  PaginationOptions,
} from '../../domain/repositories/WebhookRepository';

class WebhookRepository implements WebhookRepositoryInterface {
  // =========================================================================
  // Endpoint Operations
  // =========================================================================

  async createEndpoint(props: Omit<WebhookEndpointProps, 'createdAt' | 'updatedAt'>): Promise<WebhookEndpointProps> {
    const sql = `
      INSERT INTO "${Table.WebhookEndpoint}" (
        "webhookEndpointId", "merchantId", "name", "url", "secret",
        "events", "isActive", "headers", "retryPolicy"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      props.webhookEndpointId,
      props.merchantId,
      props.name,
      props.url,
      props.secret,
      JSON.stringify(props.events),
      props.isActive,
      props.headers ? JSON.stringify(props.headers) : null,
      JSON.stringify(props.retryPolicy),
    ];
    const result = await queryOne<WebhookEndpointProps>(sql, values);
    if (!result) throw new Error('Failed to create webhook endpoint');
    return this.parseEndpoint(result);
  }

  async findEndpointById(id: string): Promise<WebhookEndpointProps | null> {
    const sql = `SELECT * FROM "${Table.WebhookEndpoint}" WHERE "webhookEndpointId" = $1`;
    const result = await queryOne<WebhookEndpointProps>(sql, [id]);
    return result ? this.parseEndpoint(result) : null;
  }

  async findEndpointsByEvent(eventType: string): Promise<WebhookEndpointProps[]> {
    const category = eventType.split('.')[0];
    const wildcardCategory = `${category}.*`;

    const sql = `
      SELECT * FROM "${Table.WebhookEndpoint}"
      WHERE "isActive" = true
        AND (
          "events"::jsonb ? $1
          OR "events"::jsonb ? $2
          OR "events"::jsonb ? '*'
        )
      ORDER BY "createdAt" ASC
    `;
    const results = await query<WebhookEndpointProps[]>(sql, [eventType, wildcardCategory]);
    return (results || []).map(r => this.parseEndpoint(r));
  }

  async findEndpoints(
    filters?: WebhookEndpointFilters,
    pagination?: PaginationOptions,
  ): Promise<{ data: WebhookEndpointProps[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters?.merchantId) {
      conditions.push(`"merchantId" = $${values.length + 1}`);
      values.push(filters.merchantId);
    }
    if (filters?.isActive !== undefined) {
      conditions.push(`"isActive" = $${values.length + 1}`);
      values.push(filters.isActive);
    }
    if (filters?.eventType) {
      conditions.push(`"events"::jsonb ? $${values.length + 1}`);
      values.push(filters.eventType);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;

    const countSql = `SELECT COUNT(*) as count FROM "${Table.WebhookEndpoint}" ${where}`;
    const countResult = await queryOne<{ count: string }>(countSql, values);
    const total = parseInt(countResult?.count || '0', 10);

    const dataSql = `
      SELECT * FROM "${Table.WebhookEndpoint}" ${where}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const results = await query<WebhookEndpointProps[]>(dataSql, values);

    return {
      data: (results || []).map(r => this.parseEndpoint(r)),
      total,
    };
  }

  async updateEndpoint(id: string, updates: Partial<WebhookEndpointProps>): Promise<WebhookEndpointProps | null> {
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: any[] = [id];
    let paramIdx = 2;

    const fieldMap: Record<string, (v: any) => any> = {
      name: (v) => v,
      url: (v) => v,
      secret: (v) => v,
      events: (v) => JSON.stringify(v),
      isActive: (v) => v,
      headers: (v) => v ? JSON.stringify(v) : null,
      retryPolicy: (v) => JSON.stringify(v),
    };

    for (const [field, transform] of Object.entries(fieldMap)) {
      if ((updates as any)[field] !== undefined) {
        setStatements.push(`"${field}" = $${paramIdx++}`);
        values.push(transform((updates as any)[field]));
      }
    }

    if (setStatements.length === 1) return this.findEndpointById(id);

    const sql = `
      UPDATE "${Table.WebhookEndpoint}"
      SET ${setStatements.join(', ')}
      WHERE "webhookEndpointId" = $1
      RETURNING *
    `;
    const result = await queryOne<WebhookEndpointProps>(sql, values);
    return result ? this.parseEndpoint(result) : null;
  }

  async deleteEndpoint(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${Table.WebhookEndpoint}" WHERE "webhookEndpointId" = $1`;
    await query(sql, [id]);
    return true;
  }

  // =========================================================================
  // Delivery Operations
  // =========================================================================

  async createDelivery(props: Omit<WebhookDeliveryProps, 'createdAt' | 'updatedAt'>): Promise<WebhookDeliveryProps> {
    const sql = `
      INSERT INTO "${Table.WebhookDelivery}" (
        "webhookDeliveryId", "webhookEndpointId", "eventType", "eventId",
        "payload", "status", "attempts", "lastAttemptAt", "nextRetryAt",
        "responseStatus", "responseBody", "errorMessage", "duration"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      props.webhookDeliveryId,
      props.webhookEndpointId,
      props.eventType,
      props.eventId,
      JSON.stringify(props.payload),
      props.status,
      props.attempts,
      props.lastAttemptAt,
      props.nextRetryAt,
      props.responseStatus,
      props.responseBody,
      props.errorMessage,
      props.duration,
    ];
    const result = await queryOne<WebhookDeliveryProps>(sql, values);
    if (!result) throw new Error('Failed to create webhook delivery');
    return result;
  }

  async findDeliveryById(id: string): Promise<WebhookDeliveryProps | null> {
    const sql = `SELECT * FROM "${Table.WebhookDelivery}" WHERE "webhookDeliveryId" = $1`;
    return await queryOne<WebhookDeliveryProps>(sql, [id]);
  }

  async findDeliveries(
    filters?: WebhookDeliveryFilters,
    pagination?: PaginationOptions,
  ): Promise<{ data: WebhookDeliveryProps[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters?.webhookEndpointId) {
      conditions.push(`"webhookEndpointId" = $${values.length + 1}`);
      values.push(filters.webhookEndpointId);
    }
    if (filters?.eventType) {
      conditions.push(`"eventType" = $${values.length + 1}`);
      values.push(filters.eventType);
    }
    if (filters?.status) {
      conditions.push(`"status" = $${values.length + 1}`);
      values.push(filters.status);
    }
    if (filters?.since) {
      conditions.push(`"createdAt" >= $${values.length + 1}`);
      values.push(filters.since);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;

    const countSql = `SELECT COUNT(*) as count FROM "${Table.WebhookDelivery}" ${where}`;
    const countResult = await queryOne<{ count: string }>(countSql, values);
    const total = parseInt(countResult?.count || '0', 10);

    const dataSql = `
      SELECT * FROM "${Table.WebhookDelivery}" ${where}
      ORDER BY "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const results = await query<WebhookDeliveryProps[]>(dataSql, values);

    return { data: results || [], total };
  }

  async updateDelivery(id: string, updates: Partial<WebhookDeliveryProps>): Promise<WebhookDeliveryProps | null> {
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: any[] = [id];
    let paramIdx = 2;

    const fields: (keyof WebhookDeliveryProps)[] = [
      'status', 'attempts', 'lastAttemptAt', 'nextRetryAt',
      'responseStatus', 'responseBody', 'errorMessage', 'duration',
    ];

    for (const field of fields) {
      if (updates[field] !== undefined) {
        setStatements.push(`"${field}" = $${paramIdx++}`);
        values.push(updates[field]);
      }
    }

    if (setStatements.length === 1) return this.findDeliveryById(id);

    const sql = `
      UPDATE "${Table.WebhookDelivery}"
      SET ${setStatements.join(', ')}
      WHERE "webhookDeliveryId" = $1
      RETURNING *
    `;
    return await queryOne<WebhookDeliveryProps>(sql, values);
  }

  async findPendingRetries(): Promise<WebhookDeliveryProps[]> {
    const sql = `
      SELECT * FROM "${Table.WebhookDelivery}"
      WHERE "status" = 'retrying'
        AND "nextRetryAt" <= now()
      ORDER BY "nextRetryAt" ASC
      LIMIT 100
    `;
    return (await query<WebhookDeliveryProps[]>(sql)) || [];
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private parseEndpoint(row: any): WebhookEndpointProps {
    return {
      ...row,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : (row.events || []),
      headers: typeof row.headers === 'string' ? JSON.parse(row.headers) : row.headers,
      retryPolicy: typeof row.retryPolicy === 'string'
        ? JSON.parse(row.retryPolicy)
        : (row.retryPolicy || { maxRetries: 5, retryIntervalMs: 5000, backoffMultiplier: 2 }),
    };
  }
}

export default new WebhookRepository();
