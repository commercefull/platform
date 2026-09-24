import '../../tests/testUtils';
import { SsoLoginUseCase } from './SsoLogin';
import { SsoProviderNotFoundError, SsoValidationError } from '../../domain/errors/SsoErrors';
import type { SamlProviderRepository, OidcProviderRepository } from '../../domain/repositories/SsoProviderRepository';
import type { CredentialSubjectPort } from '../../application/ports/CredentialSubjectPort';
import { SamlAssertionParser } from '../../domain/services/SamlAssertionParser';
import { OidcTokenExchange } from '../../domain/services/OidcTokenExchange';
import { createSamlProvider, createOidcProvider, emitMock, lazyMock } from '../../tests/testUtils';

describe('SsoLoginUseCase', () => {
  let samlRepo: jest.Mocked<SamlProviderRepository>;
  let oidcRepo: jest.Mocked<OidcProviderRepository>;
  let credentialPort: jest.Mocked<CredentialSubjectPort>;
  let useCase: SsoLoginUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    samlRepo = lazyMock<SamlProviderRepository>();
    oidcRepo = lazyMock<OidcProviderRepository>();
    credentialPort = lazyMock<CredentialSubjectPort>();
    useCase = new SsoLoginUseCase(samlRepo, oidcRepo, credentialPort, 'test-secret');
  });

  it('should throw SsoProviderNotFoundError when initiating SAML for a missing provider', async () => {
    samlRepo.findById.mockResolvedValue(null);

    await expect(useCase.initiateSamlAsync('missing')).rejects.toThrow(SsoProviderNotFoundError);
  });

  it('should throw SsoValidationError when the SAML provider is inactive', async () => {
    const provider = createSamlProvider();
    provider.deactivate();
    samlRepo.findById.mockResolvedValue(provider);

    await expect(useCase.initiateSamlAsync('saml-1')).rejects.toThrow(SsoValidationError);
  });

  it('should build an OIDC authorization URL with a PKCE verifier when enabled', async () => {
    oidcRepo.findById.mockResolvedValue(createOidcProvider());

    const result = await useCase.initiateOidc('oidc-1');

    expect(result.authUrl).toContain('https://idp.test');
    expect(result.state).toBeTruthy();
    expect(result.codeVerifier).toBeTruthy();
  });

  it('should issue a token for an existing user after OIDC callback', async () => {
    oidcRepo.findById.mockResolvedValue(createOidcProvider());
    jest.spyOn(OidcTokenExchange.prototype, 'exchangeCodeForTokens')
      .mockResolvedValue({ accessToken: 'at', idToken: 'it', refreshToken: 'rt', tokenType: 'Bearer', expiresAt: new Date() });
    jest.spyOn(OidcTokenExchange.prototype, 'fetchUserInfo')
      .mockResolvedValue({ sub: 'sub-1', email: 'u@x.test', firstName: 'U', lastName: 'X', externalId: 'ext-1', rawClaims: {} });
    credentialPort.findByEmail.mockResolvedValue({
      id: 'user-1', email: 'u@x.test', status: 'active', isActive: true, isVerified: true,
    });

    const result = await useCase.handleOidcCallback('oidc-1', 'code', 'verifier');

    expect(result.isNewUser).toBe(false);
    expect(result.accessToken).toBeTruthy();
    expect(emitMock).toHaveBeenCalledWith('identity.sso.login', expect.objectContaining({ email: 'u@x.test', provider: 'oidc' }));
  });

  it('should create a new user after SAML callback when the email is unknown', async () => {
    samlRepo.findById.mockResolvedValue(createSamlProvider());
    jest.spyOn(SamlAssertionParser.prototype, 'parse')
      .mockReturnValue({ nameId: 'n', nameIdFormat: 'emailAddress', sessionIndex: 's', attributes: {}, issuer: 'idp', notBefore: new Date(), notOnOrAfter: new Date() });
    jest.spyOn(SamlAssertionParser.prototype, 'mapToUserInfo')
      .mockReturnValue({ email: 'new@x.test', firstName: 'N', lastName: 'U', externalId: 'ext-2', rawAttributes: {} });
    credentialPort.findByEmail.mockResolvedValue(null);
    credentialPort.createWithPassword.mockResolvedValue({
      id: 'user-new', email: 'new@x.test', status: 'active', isActive: true, isVerified: true,
    });

    const result = await useCase.handleSamlCallback('saml-1', 'saml-response');

    expect(result.isNewUser).toBe(true);
    expect(result.userId).toBe('user-new');
    expect(emitMock).toHaveBeenCalledWith('identity.sso.login', expect.objectContaining({ isNewUser: true }));
  });
});

