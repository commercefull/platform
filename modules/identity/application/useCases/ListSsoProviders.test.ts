import '../../tests/testUtils';
import { ListSsoProvidersUseCase } from './ListSsoProviders';
import type { SamlProviderRepository, OidcProviderRepository } from '../../domain/repositories/SsoProviderRepository';
import { createSamlProvider, createOidcProvider, lazyMock } from '../../tests/testUtils';

describe('ListSsoProvidersUseCase', () => {
  it('should summarize SAML and OIDC providers for an organization', async () => {
    const samlRepo = lazyMock<SamlProviderRepository>();
    const oidcRepo = lazyMock<OidcProviderRepository>();
    samlRepo.findByOrganizationId.mockResolvedValue([createSamlProvider()]);
    oidcRepo.findByOrganizationId.mockResolvedValue([createOidcProvider()]);

    const result = await new ListSsoProvidersUseCase(samlRepo, oidcRepo).execute('org-1');

    expect(result.saml).toHaveLength(1);
    expect(result.oidc).toHaveLength(1);
    expect(result.saml[0].type).toBe('saml');
  });
});
