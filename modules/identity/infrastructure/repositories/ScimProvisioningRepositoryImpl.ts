/**
 * SCIM Provisioning PostgreSQL Repository
 */

import { query, queryOne } from '../../../../libs/db';
import { ScimProvisioningRecord, ScimProvisioningRepository } from '../../domain/repositories/SsoProviderRepository';

export class ScimProvisioningRepositoryImpl implements ScimProvisioningRepository {
  async findByScimUserId(scimUserId: string): Promise<ScimProvisioningRecord | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "scimProvisioningRecord" WHERE "scimUserId" = $1',
      [scimUserId],
    );
    return row ? this.mapToRecord(row) : null;
  }

  async findByUserId(userId: string): Promise<ScimProvisioningRecord | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "scimProvisioningRecord" WHERE "userId" = $1',
      [userId],
    );
    return row ? this.mapToRecord(row) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<ScimProvisioningRecord[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "scimProvisioningRecord" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC',
      [organizationId],
    );
    return (rows || []).map(row => this.mapToRecord(row));
  }

  async save(record: ScimProvisioningRecord): Promise<ScimProvisioningRecord> {
    const existing = await queryOne<Record<string, unknown>>(
      'SELECT "recordId" FROM "scimProvisioningRecord" WHERE "recordId" = $1',
      [record.recordId],
    );

    if (existing) {
      await query(
        `UPDATE "scimProvisioningRecord" SET
          "organizationId" = $2, "userId" = $3, "scimUserId" = $4,
          "externalId" = $5, "source" = $6, "providerId" = $7,
          "isActive" = $8, "updatedAt" = NOW()
        WHERE "recordId" = $1`,
        [
          record.recordId, record.organizationId, record.userId,
          record.scimUserId, record.externalId, record.source,
          record.providerId, record.isActive,
        ],
      );
    } else {
      await query(
        `INSERT INTO "scimProvisioningRecord" (
          "recordId", "organizationId", "userId", "userType",
          "scimUserId", "externalId", "source", "providerId",
          "isActive", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          record.recordId, record.organizationId, record.userId,
          record.userType, record.scimUserId, record.externalId,
          record.source, record.providerId, record.isActive,
          record.createdAt, record.updatedAt,
        ],
      );
    }

    return record;
  }

  async deactivate(recordId: string): Promise<void> {
    await query(
      'UPDATE "scimProvisioningRecord" SET "isActive" = false, "updatedAt" = NOW() WHERE "recordId" = $1',
      [recordId],
    );
  }

  async delete(recordId: string): Promise<void> {
    await query('DELETE FROM "scimProvisioningRecord" WHERE "recordId" = $1', [recordId]);
  }

  private mapToRecord(row: Record<string, unknown>): ScimProvisioningRecord {
    return {
      recordId: row.recordId as string,
      organizationId: row.organizationId as string,
      userId: row.userId as string,
      userType: row.userType as 'organization',
      scimUserId: row.scimUserId as string,
      externalId: row.externalId as string | undefined,
      source: row.source as 'saml' | 'oidc' | 'scim',
      providerId: row.providerId as string | undefined,
      isActive: row.isActive as boolean,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
  }
}
