import { generateUUID } from '../../../../libs/uuid';
import { eventBus } from '../../../../libs/events/eventBus';
import { SamlProviderRepository, OidcProviderRepository } from '../../domain/repositories/SsoProviderRepository';
import { SamlAssertionParser, SamlUserInfo } from '../../domain/services/SamlAssertionParser';
import { OidcTokenExchange, OidcUserInfo } from '../../domain/services/OidcTokenExchange';
import { SsoProviderNotFoundError, SsoValidationError } from '../../domain/errors/SsoErrors';
import { NotImplementedError } from '../../domain/errors/IdentityErrors';
import type { CredentialSubjectPort } from '../../application/ports/CredentialSubjectPort';
import { generateAccessToken } from '../../utils/jwtHelpers';
import { logger } from '../../../../libs/logger';

export interface SsoLoginResult {
  isNewUser: boolean;
  userId: string;
  email: string;
  provider: 'saml' | 'oidc';
  providerId: string;
  accessToken: string;
  tokenType: string;
  expiresIn: string;
}


export class SsoLoginUseCase {
  private readonly samlParser = new SamlAssertionParser();
  private readonly oidcExchange = new OidcTokenExchange();

  constructor(
    private readonly samlRepo: SamlProviderRepository,
    private readonly oidcRepo: OidcProviderRepository,
    private readonly credentialPort: CredentialSubjectPort,
    private readonly jwtSecret: string,
    private readonly tokenDuration: string = '7d',
  ) {}

  /**
   * Initiate SAML SSO — returns the redirect URL to the IdP.
   */
  initiateSaml(providerId: string): { redirectUrl: string; requestId: string } {
    return this.initiateSamlWithParser(providerId, this.samlParser);
  }

  /** Testable variant with injectable parser — not used, kept for future testing */
  initiateSamlWithParser(_providerId: string, _parser: SamlAssertionParser): { redirectUrl: string; requestId: string } {
    // SAML provider lookup is async in real usage, but for redirect generation
    // we need a sync path. In practice the controller fetches the provider first.
    throw new NotImplementedError('Use initiateSamlAsync instead');
  }

  async initiateSamlAsync(providerId: string): Promise<{ redirectUrl: string; requestId: string }> {
    const provider = await this.samlRepo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    if (!provider.isActive) throw new SsoValidationError('SAML provider is not active');

    const requestId = generateUUID();
    const redirectUrl = this.samlParser.createRedirectUrl(provider, requestId);
    return { redirectUrl, requestId };
  }

  /**
   * Handle SAML ACS callback — parse assertion, find-or-create user, issue JWT.
   */
  async handleSamlCallback(providerId: string, samlResponse: string, ip?: string): Promise<SsoLoginResult> {
    const provider = await this.samlRepo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    if (!provider.isActive) throw new SsoValidationError('SAML provider is not active');

    const assertion = this.samlParser.parse(samlResponse, provider);
    const userInfo = this.samlParser.mapToUserInfo(assertion, provider.attributeMapping);

    return this.findOrCreateAndIssueToken(userInfo, 'saml', providerId, ip);
  }

  /**
   * Initiate OIDC SSO — returns the authorization URL.
   */
  async initiateOidc(providerId: string): Promise<{ authUrl: string; state: string; codeVerifier?: string }> {
    const provider = await this.oidcRepo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    if (!provider.isActive) throw new SsoValidationError('OIDC provider is not active');

    const state = this.oidcExchange.generateState();
    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    if (provider.usePkce) {
      const pkce = this.oidcExchange.generatePkcePair();
      codeVerifier = pkce.verifier;
      codeChallenge = pkce.challenge;
    }

    const authUrl = this.oidcExchange.buildAuthorizationUrl(provider, state, codeChallenge);
    return { authUrl, state, codeVerifier };
  }

  /**
   * Handle OIDC callback — exchange code for tokens, fetch userinfo, issue JWT.
   */
  async handleOidcCallback(providerId: string, code: string, codeVerifier?: string, ip?: string): Promise<SsoLoginResult> {
    const provider = await this.oidcRepo.findById(providerId);
    if (!provider) throw new SsoProviderNotFoundError(providerId);
    if (!provider.isActive) throw new SsoValidationError('OIDC provider is not active');

    const tokens = await this.oidcExchange.exchangeCodeForTokens(provider, code, codeVerifier);
    const userInfo = await this.oidcExchange.fetchUserInfo(provider, tokens.accessToken);

    return this.findOrCreateAndIssueToken(userInfo, 'oidc', providerId, ip);
  }

  private async findOrCreateAndIssueToken(
    userInfo: SamlUserInfo | OidcUserInfo,
    providerType: 'saml' | 'oidc',
    providerId: string,
    ip?: string,
  ): Promise<SsoLoginResult> {
    const email = userInfo.email;
    const firstName = 'firstName' in userInfo ? userInfo.firstName : undefined;
    const lastName = 'lastName' in userInfo ? userInfo.lastName : undefined;

    // Find existing user by email
    const existing = await this.credentialPort.findByEmail(email);
    let userId: string;
    let isNewUser = false;

    if (existing) {
      userId = existing.id;
    } else {
      // Create new user (SSO users don't have a password)
      const created = await this.credentialPort.createWithPassword({
        email,
        password: '',
        firstName: firstName || '',
        lastName: lastName || '',
        isActive: true,
        isVerified: true,
      });
      userId = created.id;
      isNewUser = true;
    }

    // Issue JWT
    const accessToken = generateAccessToken(userId, email, 'organization', this.jwtSecret, this.tokenDuration);

    // Emit event
    eventBus.emit('identity.sso.login', {
      userId,
      email,
      provider: providerType,
      providerId,
      isNewUser,
      ipAddress: ip,
      timestamp: new Date(),
    });

    logger.info('SSO login successful', { userId, provider: providerType, providerId, isNewUser });

    return {
      isNewUser,
      userId,
      email,
      provider: providerType,
      providerId,
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.tokenDuration,
    };
  }
}

// ============================================================================
// List SSO Providers
// ============================================================================

