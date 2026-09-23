import '../../tests/testUtils';
import { ManageOidcProviderUseCase } from './ManageOidcProvider';
import { SsoProviderNotFoundError } from '../../domain/errors/SsoErrors';
import type { OidcProviderRepository } from '../../domain/repositories/SsoProviderRepository';
import { lazyMock } from '../../tests/testUtils';

describe('ManageOidcProviderUseCase', () => {
  let repo: jest.Mocked<OidcProviderRepository>;
  let useCase: ManageOidcProviderUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<OidcProviderRepository>();
    repo.save.mockImplementation(async p => p);
    useCase = new ManageOidcProviderUseCase(repo);
  });

  it('should create an OIDC provider', async () => {
    const result = await useCase.create({
      organizationId: 'org-1', name: 'Auth0', issuerUrl: 'https://idp.test',
      clientId: 'c', clientSecret: 's', redirectUri: 'https://app.test/cb',
    });

    expect(repo.save).toHaveBeenCalled();
    expect(result.isActive).toBe(true);
  });

  it('should throw SsoProviderNotFoundError when the provider does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.updateClaimMapping('missing', {})).rejects.toThrow(SsoProviderNotFoundError);
  });
});

