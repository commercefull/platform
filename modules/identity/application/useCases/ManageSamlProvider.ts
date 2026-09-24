import { generateUUID } from '../../../../libs/uuid';
import { SamlProvider, SamlAttributeMapping } from '../../domain/entities/SamlProvider';
import { SamlProviderRepository } from '../../domain/repositories/SsoProviderRepository';
import { SsoProviderNotFoundError } from '../../domain/errors/SsoErrors';

export class ManageSamlProviderUseCase {
  constructor(private readonly repo: SamlProviderRepository) {}

  async create(params: {
    organizationId: string;
    name: string;
    entityId: string;
    ssoUrl: string;
    certificate: string;
    spEntityId: string;
    acsUrl: string;
    binding?: 'redirect' | 'post';
    nameIdFormat?: 'unspecified' | 'emailAddress' | 'persistent' | 'transient';
    signAuthnRequest?: boolean;
    sloUrl?: string;
    spPrivateKey?: string;
    spCertificate?: string;
    attributeMapping?: Partial<SamlAttributeMapping>;
  }): Promise<SamlProvider> {
    const provider = SamlProvider.create({
      providerId: generateUUID(),
      ...params,
    });
    return this.repo.save(provider);
  }

  async getById(providerId: string): Promise<SamlProvider | null> {
    return this.repo.findById(providerId);
  }

  async getByOrganizationId(organizationId: string): Promise<SamlProvider[]> {
    return this.repo.findByOrganizationId(organizationId);
  }

  async update(
    providerId: string,
    updates: {
      name?: string;
      entityId?: string;
      ssoUrl?: string;
      sloUrl?: string;
      certificate?: string;
      spEntityId?: string;
      acsUrl?: string;
      binding?: 'redirect' | 'post';
      nameIdFormat?: 'unspecified' | 'emailAddress' | 'persistent' | 'transient';
      signAuthnRequest?: boolean;
    },
  ): Promise<SamlProvider> {
    const provider = await this.repo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    provider.updateMetadata(updates);
    return this.repo.save(provider);
  }

  async updateAttributeMapping(providerId: string, mapping: Partial<SamlAttributeMapping>): Promise<SamlProvider> {
    const provider = await this.repo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    provider.updateAttributeMapping(mapping);
    return this.repo.save(provider);
  }

  async activate(providerId: string): Promise<SamlProvider> {
    const provider = await this.repo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    provider.activate();
    return this.repo.save(provider);
  }

  async deactivate(providerId: string): Promise<SamlProvider> {
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
// Manage OIDC Provider
// ============================================================================

