import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { IntegrationCredential, type IntegrationCredentialProps, type CredentialType } from '../../domain/entities/IntegrationCredential';
import type { IntegrationCredentialRepository } from '../../domain/repositories/IntegrationRepository';

interface CredentialDbRow {
  credentialId: string;
  integrationId: string;
  type: string;
  label: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class IntegrationCredentialRepositoryImpl implements IntegrationCredentialRepository {
  async create(credential: IntegrationCredential): Promise<IntegrationCredential> {
    const props = credential;
    await query(
      `INSERT INTO "${Table.IntegrationCredential}" (
        "credentialId", "integrationId", "type", "label",
        "encryptedData", "iv", "authTag", "expiresAt", "isActive",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        props.credentialId, props.integrationId, props.type, props.label,
        props.encryptedData, props.iv, props.authTag, props.expiresAt, props.isActive,
        props.createdAt, props.updatedAt,
      ],
    );
    return credential;
  }

  async findById(credentialId: string): Promise<IntegrationCredential | null> {
    const row = await queryOne<CredentialDbRow>(
      `SELECT * FROM "${Table.IntegrationCredential}" WHERE "credentialId" = $1`,
      [credentialId],
    );
    if (!row) return null;
    return IntegrationCredential.reconstitute(this.mapRowToProps(row));
  }

  async findByIntegration(integrationId: string): Promise<IntegrationCredential[]> {
    const rows = await query<CredentialDbRow[]>(
      `SELECT * FROM "${Table.IntegrationCredential}" WHERE "integrationId" = $1 ORDER BY "createdAt" DESC`,
      [integrationId],
    );
    return (rows ?? []).map((r) => IntegrationCredential.reconstitute(this.mapRowToProps(r)));
  }

  async findActiveByIntegration(integrationId: string): Promise<IntegrationCredential[]> {
    const rows = await query<CredentialDbRow[]>(
      `SELECT * FROM "${Table.IntegrationCredential}" WHERE "integrationId" = $1 AND "isActive" = true ORDER BY "createdAt" DESC`,
      [integrationId],
    );
    return (rows ?? []).map((r) => IntegrationCredential.reconstitute(this.mapRowToProps(r)));
  }

  async update(credential: IntegrationCredential): Promise<IntegrationCredential> {
    const props = credential;
    await query(
      `UPDATE "${Table.IntegrationCredential}" SET
        "label" = $2, "encryptedData" = $3, "iv" = $4, "authTag" = $5,
        "expiresAt" = $6, "isActive" = $7, "updatedAt" = $8
      WHERE "credentialId" = $1`,
      [
        props.credentialId, props.label, props.encryptedData, props.iv, props.authTag,
        props.expiresAt, props.isActive, props.updatedAt,
      ],
    );
    return credential;
  }

  async delete(credentialId: string): Promise<boolean> {
    const result = await queryOne<{ credentialId: string }>(
      `DELETE FROM "${Table.IntegrationCredential}" WHERE "credentialId" = $1 RETURNING "credentialId"`,
      [credentialId],
    );
    return !!result;
  }

  private mapRowToProps(row: CredentialDbRow): IntegrationCredentialProps {
    return {
      credentialId: row.credentialId,
      integrationId: row.integrationId,
      type: row.type as CredentialType,
      label: row.label,
      encryptedData: row.encryptedData,
      iv: row.iv,
      authTag: row.authTag,
      expiresAt: row.expiresAt,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
