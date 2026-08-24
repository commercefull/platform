/**
 * SSO Use Cases
 *
 * - ManageSamlProvider: CRUD for SAML provider configs
 * - ManageOidcProvider: CRUD for OIDC provider configs
 * - SsoLogin: Authenticate via SAML or OIDC, find-or-create user
 * - ListSsoProviders: List SSO providers for an organization
 */

import { generateUUID } from '../../../../libs/uuid';
import { eventBus } from '../../../../libs/events/eventBus';
import { SamlProvider, SamlAttributeMapping } from '../../domain/entities/SamlProvider';
import { OidcProvider, OidcClaimMapping } from '../../domain/entities/OidcProvider';
import { SamlProviderRepository, OidcProviderRepository } from '../../domain/repositories/SsoProviderRepository';
import { SamlAssertionParser, SamlUserInfo } from '../../domain/services/SamlAssertionParser';
import { OidcTokenExchange, OidcUserInfo } from '../../domain/services/OidcTokenExchange';
import {
  SsoProviderNotFoundError,
  SsoValidationError,
} from '../../domain/errors/SsoErrors';
import { NotImplementedError } from '../../domain/errors/IdentityErrors';
import type { CredentialSubjectPort } from '../../application/ports/CredentialSubjectPort';
import { generateAccessToken } from '../../utils/jwtHelpers';
import { logger } from '../../../../libs/logger';

// ============================================================================
// Manage SAML Provider
// ============================================================================

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

  async update(providerId: string, updates: {
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
  }): Promise<SamlProvider> {
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

  async update(providerId: string, updates: {
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
  }): Promise<OidcProvider> {
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
  async handleOidcCallback(
    providerId: string,
    code: string,
    codeVerifier?: string,
    ip?: string,
  ): Promise<SsoLoginResult> {
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
