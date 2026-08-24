/**
 * SAML Provider PostgreSQL Repository
 */

import { query, queryOne } from '../../../../libs/db';
import { SamlProvider, SamlProviderProps, SamlBinding, SamlNameIdFormat, SamlAttributeMapping } from '../../domain/entities/SamlProvider';
import { SamlProviderRepository } from '../../domain/repositories/SsoProviderRepository';

export class SamlProviderRepositoryImpl implements SamlProviderRepository {
  async findById(providerId: string): Promise<SamlProvider | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "samlProvider" WHERE "providerId" = $1',
      [providerId],
    );
    return row ? this.mapToEntity(row) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<SamlProvider[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "samlProvider" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC',
      [organizationId],
    );
    return (rows || []).map(row => this.mapToEntity(row));
  }

  async findActiveByOrganizationId(organizationId: string): Promise<SamlProvider[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "samlProvider" WHERE "organizationId" = $1 AND "isActive" = true ORDER BY "createdAt" DESC',
      [organizationId],
    );
    return (rows || []).map(row => this.mapToEntity(row));
  }

  async save(provider: SamlProvider): Promise<SamlProvider> {
    const props = this.getProps(provider);
    const existing = await queryOne<Record<string, unknown>>(
      'SELECT "providerId" FROM "samlProvider" WHERE "providerId" = $1',
      [props.providerId],
    );

    if (existing) {
      await query(
        `UPDATE "samlProvider" SET
          "organizationId" = $2, "name" = $3, "entityId" = $4, "ssoUrl" = $5,
          "sloUrl" = $6, "certificate" = $7, "spEntityId" = $8, "acsUrl" = $9,
          "binding" = $10, "nameIdFormat" = $11, "signAuthnRequest" = $12,
          "spPrivateKey" = $13, "spCertificate" = $14, "attributeMapping" = $15,
          "isActive" = $16, "updatedAt" = NOW()
        WHERE "providerId" = $1`,
        [
          props.providerId, props.organizationId, props.name, props.entityId,
          props.ssoUrl, props.sloUrl, props.certificate, props.spEntityId,
          props.acsUrl, props.binding, props.nameIdFormat, props.signAuthnRequest,
          props.spPrivateKey, props.spCertificate, JSON.stringify(props.attributeMapping),
          props.isActive,
        ],
      );
    } else {
      await query(
        `INSERT INTO "samlProvider" (
          "providerId", "organizationId", "name", "entityId", "ssoUrl",
          "sloUrl", "certificate", "spEntityId", "acsUrl", "binding",
          "nameIdFormat", "signAuthnRequest", "spPrivateKey", "spCertificate",
          "attributeMapping", "isActive", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
        [
          props.providerId, props.organizationId, props.name, props.entityId,
          props.ssoUrl, props.sloUrl, props.certificate, props.spEntityId,
          props.acsUrl, props.binding, props.nameIdFormat, props.signAuthnRequest,
          props.spPrivateKey, props.spCertificate, JSON.stringify(props.attributeMapping),
          props.isActive,
        ],
      );
    }

    return provider;
  }

  async delete(providerId: string): Promise<void> {
    await query('DELETE FROM "samlProvider" WHERE "providerId" = $1', [providerId]);
  }

  private getProps(provider: SamlProvider): SamlProviderProps {
    return {
      providerId: provider.providerId,
      organizationId: provider.organizationId,
      name: provider.name,
      entityId: provider.entityId,
      ssoUrl: provider.ssoUrl,
      sloUrl: provider.sloUrl,
      certificate: provider.certificate,
      spEntityId: provider.spEntityId,
      acsUrl: provider.acsUrl,
      binding: provider.binding,
      nameIdFormat: provider.nameIdFormat,
      signAuthnRequest: provider.signAuthnRequest,
      spPrivateKey: provider.spPrivateKey,
      spCertificate: provider.spCertificate,
      attributeMapping: provider.attributeMapping,
      isActive: provider.isActive,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  private mapToEntity(row: Record<string, unknown>): SamlProvider {
    return SamlProvider.reconstitute({
      providerId: row.providerId as string,
      organizationId: row.organizationId as string,
      name: row.name as string,
      entityId: row.entityId as string,
      ssoUrl: row.ssoUrl as string,
      sloUrl: row.sloUrl as string | undefined,
      certificate: row.certificate as string,
      spEntityId: row.spEntityId as string,
      acsUrl: row.acsUrl as string,
      binding: row.binding as SamlBinding,
      nameIdFormat: row.nameIdFormat as SamlNameIdFormat,
      signAuthnRequest: row.signAuthnRequest as boolean,
      spPrivateKey: row.spPrivateKey as string | undefined,
      spCertificate: row.spCertificate as string | undefined,
      attributeMapping: row.attributeMapping as SamlAttributeMapping,
      isActive: row.isActive as boolean,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    });
  }
}
