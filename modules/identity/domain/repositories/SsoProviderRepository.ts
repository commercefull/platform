/**
 * SSO Provider Repository Ports
 */

import { SamlProvider } from '../entities/SamlProvider';
import { OidcProvider } from '../entities/OidcProvider';

export interface SamlProviderRepository {
  findById(providerId: string): Promise<SamlProvider | null>;
  findByOrganizationId(organizationId: string): Promise<SamlProvider[]>;
  findActiveByOrganizationId(organizationId: string): Promise<SamlProvider[]>;
  save(provider: SamlProvider): Promise<SamlProvider>;
  delete(providerId: string): Promise<void>;
}

export interface OidcProviderRepository {
  findById(providerId: string): Promise<OidcProvider | null>;
  findByOrganizationId(organizationId: string): Promise<OidcProvider[]>;
  findActiveByOrganizationId(organizationId: string): Promise<OidcProvider[]>;
  save(provider: OidcProvider): Promise<OidcProvider>;
  delete(providerId: string): Promise<void>;
}

export interface ScimProvisioningRecord {
  recordId: string;
  organizationId: string;
  userId: string;
  userType: 'organization';
  scimUserId: string;
  externalId?: string;
  source: 'saml' | 'oidc' | 'scim';
  providerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScimProvisioningRepository {
  findByScimUserId(scimUserId: string): Promise<ScimProvisioningRecord | null>;
  findByUserId(userId: string): Promise<ScimProvisioningRecord | null>;
  findByOrganizationId(organizationId: string): Promise<ScimProvisioningRecord[]>;
  save(record: ScimProvisioningRecord): Promise<ScimProvisioningRecord>;
  deactivate(recordId: string): Promise<void>;
  delete(recordId: string): Promise<void>;
}
