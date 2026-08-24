/**
 * OIDC Provider PostgreSQL Repository
 */

import { query, queryOne } from '../../../../libs/db';
import { OidcProvider, OidcProviderProps, OidcClaimMapping } from '../../domain/entities/OidcProvider';
import { OidcProviderRepository } from '../../domain/repositories/SsoProviderRepository';

export class OidcProviderRepositoryImpl implements OidcProviderRepository {
  async findById(providerId: string): Promise<OidcProvider | null> {
    const row = await queryOne<Record<string, unknown>>(
      'SELECT * FROM "oidcProvider" WHERE "providerId" = $1',
      [providerId],
    );
    return row ? this.mapToEntity(row) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<OidcProvider[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "oidcProvider" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC',
      [organizationId],
    );
    return (rows || []).map(row => this.mapToEntity(row));
  }

  async findActiveByOrganizationId(organizationId: string): Promise<OidcProvider[]> {
    const rows = await query<Record<string, unknown>[]>(
      'SELECT * FROM "oidcProvider" WHERE "organizationId" = $1 AND "isActive" = true ORDER BY "createdAt" DESC',
      [organizationId],
    );
    return (rows || []).map(row => this.mapToEntity(row));
  }

  async save(provider: OidcProvider): Promise<OidcProvider> {
    const props = this.getProps(provider);
    const existing = await queryOne<Record<string, unknown>>(
      'SELECT "providerId" FROM "oidcProvider" WHERE "providerId" = $1',
      [props.providerId],
    );

    if (existing) {
      await query(
        `UPDATE "oidcProvider" SET
          "organizationId" = $2, "name" = $3, "issuerUrl" = $4, "clientId" = $5,
          "clientSecret" = $6, "scopes" = $7, "redirectUri" = $8, "usePkce" = $9,
          "claimMapping" = $10, "isActive" = $11, "useDiscovery" = $12,
          "authorizationEndpoint" = $13, "tokenEndpoint" = $14, "userinfoEndpoint" = $15,
          "jwksUri" = $16, "updatedAt" = NOW()
        WHERE "providerId" = $1`,
        [
          props.providerId, props.organizationId, props.name, props.issuerUrl,
          props.clientId, props.clientSecret, JSON.stringify(props.scopes),
          props.redirectUri, props.usePkce, JSON.stringify(props.claimMapping),
          props.isActive, props.useDiscovery,
          props.authorizationEndpoint, props.tokenEndpoint, props.userinfoEndpoint,
          props.jwksUri,
        ],
      );
    } else {
      await query(
        `INSERT INTO "oidcProvider" (
          "providerId", "organizationId", "name", "issuerUrl", "clientId",
          "clientSecret", "scopes", "redirectUri", "usePkce", "claimMapping",
          "isActive", "useDiscovery", "authorizationEndpoint", "tokenEndpoint",
          "userinfoEndpoint", "jwksUri", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
        [
          props.providerId, props.organizationId, props.name, props.issuerUrl,
          props.clientId, props.clientSecret, JSON.stringify(props.scopes),
          props.redirectUri, props.usePkce, JSON.stringify(props.claimMapping),
          props.isActive, props.useDiscovery,
          props.authorizationEndpoint, props.tokenEndpoint, props.userinfoEndpoint,
          props.jwksUri,
        ],
      );
    }

    return provider;
  }

  async delete(providerId: string): Promise<void> {
    await query('DELETE FROM "oidcProvider" WHERE "providerId" = $1', [providerId]);
  }

  private getProps(provider: OidcProvider): OidcProviderProps {
    return {
      providerId: provider.providerId,
      organizationId: provider.organizationId,
      name: provider.name,
      issuerUrl: provider.issuerUrl,
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
      scopes: provider.scopes,
      redirectUri: provider.redirectUri,
      usePkce: provider.usePkce,
      useDiscovery: provider.useDiscovery,
      authorizationEndpoint: provider.authorizationEndpoint,
      tokenEndpoint: provider.tokenEndpoint,
      userinfoEndpoint: provider.userinfoEndpoint,
      jwksUri: provider.jwksUri,
      claimMapping: provider.claimMapping,
      isActive: provider.isActive,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  private mapToEntity(row: Record<string, unknown>): OidcProvider {
    return OidcProvider.reconstitute({
      providerId: row.providerId as string,
      organizationId: row.organizationId as string,
      name: row.name as string,
      issuerUrl: row.issuerUrl as string,
      clientId: row.clientId as string,
      clientSecret: row.clientSecret as string,
      scopes: row.scopes as string[],
      redirectUri: row.redirectUri as string,
      usePkce: row.usePkce as boolean,
      useDiscovery: row.useDiscovery as boolean,
      authorizationEndpoint: row.authorizationEndpoint as string | undefined,
      tokenEndpoint: row.tokenEndpoint as string | undefined,
      userinfoEndpoint: row.userinfoEndpoint as string | undefined,
      jwksUri: row.jwksUri as string | undefined,
      claimMapping: row.claimMapping as OidcClaimMapping,
      isActive: row.isActive as boolean,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    });
  }
}
