import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import type { Integration as DbIntegration } from '../../../../libs/db/types';
import { Integration, type IntegrationProps, type IntegrationStatus } from '../../domain/entities/Integration';
import type { IntegrationRepository, IntegrationFilters } from '../../domain/repositories/IntegrationRepository';

type IntegrationDbRow = DbIntegration;

export class IntegrationRepositoryImpl implements IntegrationRepository {
  async create(integration: Integration): Promise<Integration> {
    const props = integration.toJSON();
    await query(
      `INSERT INTO "${Table.Integration}" (
        "integrationId", "organizationId", "name", "provider", "status",
        "description", "webhookUrl", "config", "lastSyncAt", "lastError",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        props.integrationId,
        props.organizationId,
        props.name,
        props.provider,
        props.status,
        props.description,
        props.webhookUrl,
        JSON.stringify(props.config),
        props.lastSyncAt,
        props.lastError,
        props.createdAt,
        props.updatedAt,
      ],
    );
    return integration;
  }

  async findById(integrationId: string): Promise<Integration | null> {
    const row = await queryOne<IntegrationDbRow>(`SELECT * FROM "${Table.Integration}" WHERE "integrationId" = $1`, [integrationId]);
    if (!row) return null;
    return Integration.reconstitute(this.mapRowToProps(row));
  }

  async findByOrganization(organizationId: string, filters?: IntegrationFilters): Promise<Integration[]> {
    let sql = `SELECT * FROM "${Table.Integration}" WHERE "organizationId" = $1`;
    const params: unknown[] = [organizationId];
    if (filters?.provider) {
      params.push(filters.provider);
      sql += ` AND "provider" = $${params.length}`;
    }
    if (filters?.status) {
      params.push(filters.status);
      sql += ` AND "status" = $${params.length}`;
    }
    sql += ` ORDER BY "createdAt" DESC`;
    const rows = await query<IntegrationDbRow[]>(sql, params as unknown[]);
    return (rows ?? []).map(r => Integration.reconstitute(this.mapRowToProps(r)));
  }

  async findByProvider(provider: string, filters?: { status?: IntegrationStatus }): Promise<Integration[]> {
    let sql = `SELECT * FROM "${Table.Integration}" WHERE "provider" = $1`;
    const params: unknown[] = [provider];
    if (filters?.status) {
      params.push(filters.status);
      sql += ` AND "status" = $${params.length}`;
    }
    sql += ` ORDER BY "createdAt" DESC`;
    const rows = await query<IntegrationDbRow[]>(sql, params as unknown[]);
    return (rows ?? []).map(r => Integration.reconstitute(this.mapRowToProps(r)));
  }

  async update(integration: Integration): Promise<Integration> {
    const props = integration.toJSON();
    await query(
      `UPDATE "${Table.Integration}" SET
        "name" = $2, "status" = $3, "description" = $4, "webhookUrl" = $5,
        "config" = $6, "lastSyncAt" = $7, "lastError" = $8, "updatedAt" = $9
      WHERE "integrationId" = $1`,
      [
        props.integrationId,
        props.name,
        props.status,
        props.description,
        props.webhookUrl,
        JSON.stringify(props.config),
        props.lastSyncAt,
        props.lastError,
        props.updatedAt,
      ],
    );
    return integration;
  }

  async delete(integrationId: string): Promise<boolean> {
    const result = await queryOne<{ integrationId: string }>(
      `DELETE FROM "${Table.Integration}" WHERE "integrationId" = $1 RETURNING "integrationId"`,
      [integrationId],
    );
    return !!result;
  }

  private mapRowToProps(row: IntegrationDbRow): IntegrationProps {
    return {
      integrationId: row.integrationId,
      organizationId: row.organizationId,
      name: row.name,
      provider: row.provider,
      status: row.status as IntegrationStatus,
      description: row.description,
      webhookUrl: row.webhookUrl,
      config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config,
      lastSyncAt: row.lastSyncAt,
      lastError: row.lastError,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
