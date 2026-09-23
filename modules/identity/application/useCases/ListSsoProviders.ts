import { SamlProviderRepository, OidcProviderRepository } from '../../domain/repositories/SsoProviderRepository';

export interface SsoProviderSummary {
  providerId: string;
  name: string;
  type: 'saml' | 'oidc';
  isActive: boolean;
}


export class ListSsoProvidersUseCase {
  constructor(
    private readonly samlRepo: SamlProviderRepository,
    private readonly oidcRepo: OidcProviderRepository,
  ) {}

  async execute(organizationId: string): Promise<{ saml: SsoProviderSummary[]; oidc: SsoProviderSummary[] }> {
    const [samlProviders, oidcProviders] = await Promise.all([
      this.samlRepo.findByOrganizationId(organizationId),
      this.oidcRepo.findByOrganizationId(organizationId),
    ]);

    return {
      saml: samlProviders.map(p => ({
        providerId: p.providerId,
        name: p.name,
        type: 'saml' as const,
        isActive: p.isActive,
      })),
      oidc: oidcProviders.map(p => ({
        providerId: p.providerId,
        name: p.name,
        type: 'oidc' as const,
        isActive: p.isActive,
      })),
    };
  }
}
