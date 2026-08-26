import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { IntegrationEventSubscription, type IntegrationEventSubscriptionProps } from '../../domain/entities/IntegrationEventSubscription';
import type { IntegrationSubscriptionRepository } from '../../domain/repositories/IntegrationRepository';

interface SubscriptionDbRow {
  subscriptionId: string;
  integrationId: string;
  eventType: string;
  targetAction: string;
  description: string | null;
  payloadMapping: Record<string, unknown> | string;
  headers: Record<string, string> | string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class IntegrationSubscriptionRepositoryImpl implements IntegrationSubscriptionRepository {
  async create(subscription: IntegrationEventSubscription): Promise<IntegrationEventSubscription> {
    const props = subscription.toJSON();
    await query(
      `INSERT INTO "${Table.IntegrationSubscription}" (
        "subscriptionId", "integrationId", "eventType", "targetAction",
        "description", "payloadMapping", "headers", "isActive",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        props.subscriptionId, props.integrationId, props.eventType, props.targetAction,
        props.description, JSON.stringify(props.payloadMapping),
        props.headers ? JSON.stringify(props.headers) : null, props.isActive,
        props.createdAt, props.updatedAt,
      ],
    );
    return subscription;
  }

  async findById(subscriptionId: string): Promise<IntegrationEventSubscription | null> {
    const row = await queryOne<SubscriptionDbRow>(
      `SELECT * FROM "${Table.IntegrationSubscription}" WHERE "subscriptionId" = $1`,
      [subscriptionId],
    );
    if (!row) return null;
    return IntegrationEventSubscription.reconstitute(this.mapRowToProps(row));
  }

  async findByIntegration(integrationId: string): Promise<IntegrationEventSubscription[]> {
    const rows = await query<SubscriptionDbRow[]>(
      `SELECT * FROM "${Table.IntegrationSubscription}" WHERE "integrationId" = $1 ORDER BY "createdAt" DESC`,
      [integrationId],
    );
    return (rows ?? []).map((r) => IntegrationEventSubscription.reconstitute(this.mapRowToProps(r)));
  }

  async findByEventType(eventType: string): Promise<IntegrationEventSubscription[]> {
    const rows = await query<SubscriptionDbRow[]>(
      `SELECT * FROM "${Table.IntegrationSubscription}" WHERE "isActive" = true AND ("eventType" = $1 OR "eventType" = '*' OR "eventType" LIKE '%.*')`,
      [eventType],
    );
    return (rows ?? [])
      .map((r) => IntegrationEventSubscription.reconstitute(this.mapRowToProps(r)))
      .filter((s) => s.subscribesToEvent(eventType));
  }

  async update(subscription: IntegrationEventSubscription): Promise<IntegrationEventSubscription> {
    const props = subscription.toJSON();
    await query(
      `UPDATE "${Table.IntegrationSubscription}" SET
        "targetAction" = $2, "description" = $3, "payloadMapping" = $4,
        "headers" = $5, "isActive" = $6, "updatedAt" = $7
      WHERE "subscriptionId" = $1`,
      [
        props.subscriptionId, props.targetAction, props.description,
        JSON.stringify(props.payloadMapping),
        props.headers ? JSON.stringify(props.headers) : null,
        props.isActive, props.updatedAt,
      ],
    );
    return subscription;
  }

  async delete(subscriptionId: string): Promise<boolean> {
    const result = await queryOne<{ subscriptionId: string }>(
      `DELETE FROM "${Table.IntegrationSubscription}" WHERE "subscriptionId" = $1 RETURNING "subscriptionId"`,
      [subscriptionId],
    );
    return !!result;
  }

  private mapRowToProps(row: SubscriptionDbRow): IntegrationEventSubscriptionProps {
    return {
      subscriptionId: row.subscriptionId,
      integrationId: row.integrationId,
      eventType: row.eventType,
      targetAction: row.targetAction,
      description: row.description,
      payloadMapping: typeof row.payloadMapping === 'string' ? JSON.parse(row.payloadMapping) : row.payloadMapping,
      headers: row.headers ? (typeof row.headers === 'string' ? JSON.parse(row.headers) : row.headers) : null,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
