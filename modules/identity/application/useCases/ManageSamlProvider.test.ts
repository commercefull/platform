import '../../tests/testUtils';
import { ManageSamlProviderUseCase } from './ManageSamlProvider';
import { SsoProviderNotFoundError } from '../../domain/errors/SsoErrors';
import type { SamlProviderRepository } from '../../domain/repositories/SsoProviderRepository';
import { createSamlProvider, lazyMock } from '../../tests/testUtils';

describe('ManageSamlProviderUseCase', () => {
  let repo: jest.Mocked<SamlProviderRepository>;
  let useCase: ManageSamlProviderUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<SamlProviderRepository>();
    repo.save.mockImplementation(async p => p);
    useCase = new ManageSamlProviderUseCase(repo);
  });

  it('should create a SAML provider', async () => {
    const result = await useCase.create({
      organizationId: 'org-1', name: 'Okta', entityId: 'e', ssoUrl: 'https://x.test',
      certificate: 'c', spEntityId: 'sp', acsUrl: 'https://a.test',
    });

    expect(result.isActive).toBe(true);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw SsoProviderNotFoundError when updating a missing provider', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.update('missing', { name: 'x' })).rejects.toThrow(SsoProviderNotFoundError);
  });

  it('should deactivate an existing provider', async () => {
    repo.findById.mockResolvedValue(createSamlProvider());

    const result = await useCase.deactivate('saml-1');

    expect(result.isActive).toBe(false);
  });
});

