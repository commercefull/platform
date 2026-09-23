import { generateUUID } from '../../../../libs/uuid';
import { OidcProvider, OidcClaimMapping } from '../../domain/entities/OidcProvider';
import { OidcProviderRepository } from '../../domain/repositories/SsoProviderRepository';
import { SsoProviderNotFoundError } from '../../domain/errors/SsoErrors';

export class ManageOidcProviderUseCase {
  constructor(private readonly repo: OidcProviderRepository) {}

  async create(params: {
    organizationId: string;
    name: string;
    issuerUrl: string;
    clientId: string;
    clientSecret: string;
    scopes?: string[];
    redirectUri: string;
    usePkce?: boolean;
    useDiscovery?: boolean;
    authorizationEndpoint?: string;
    tokenEndpoint?: string;
    userinfoEndpoint?: string;
    jwksUri?: string;
    claimMapping?: Partial<OidcClaimMapping>;
  }): Promise<OidcProvider> {
    const provider = OidcProvider.create({
      providerId: generateUUID(),
      ...params,
    });
    return this.repo.save(provider);
  }

  async getById(providerId: string): Promise<OidcProvider | null> {
    return this.repo.findById(providerId);
  }

  async getByOrganizationId(organizationId: string): Promise<OidcProvider[]> {
    return this.repo.findByOrganizationId(organizationId);
  }

  async update(
    providerId: string,
    updates: {
      name?: string;
      issuerUrl?: string;
      clientId?: string;
      clientSecret?: string;
      scopes?: string[];
      redirectUri?: string;
      usePkce?: boolean;
      useDiscovery?: boolean;
      authorizationEndpoint?: string;
      tokenEndpoint?: string;
      userinfoEndpoint?: string;
      jwksUri?: string;
    },
  ): Promise<OidcProvider> {
    const provider = await this.repo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    provider.updateConfig(updates);
    return this.repo.save(provider);
  }

  async updateClaimMapping(providerId: string, mapping: Partial<OidcClaimMapping>): Promise<OidcProvider> {
    const provider = await this.repo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    provider.updateClaimMapping(mapping);
    return this.repo.save(provider);
  }

  async activate(providerId: string): Promise<OidcProvider> {
    const provider = await this.repo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    provider.activate();
    return this.repo.save(provider);
  }

  async deactivate(providerId: string): Promise<OidcProvider> {
    const provider = await this.repo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    provider.deactivate();
    return this.repo.save(provider);
  }

  async delete(providerId: string): Promise<void> {
    const provider = await this.repo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    await this.repo.delete(providerId);
  }
}

// ============================================================================
// SSO Login
// ============================================================================

