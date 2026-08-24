/**
 * OIDC Provider Entity
 *
 * Per-organization OpenID Connect provider configuration.
 * Stores issuer URL, client credentials, scopes, and claim mappings.
 */

import { SsoValidationError } from '../errors/SsoErrors';

export interface OidcClaimMapping {
  /** Maps OIDC claims to platform user fields */
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  /** Additional claims to store as metadata */
  extra?: Record<string, string>;
}

export interface OidcProviderProps {
  providerId: string;
  organizationId: string;
  name: string;
  /** Issuer URL (e.g. https://login.microsoftonline.com/{tenant}/v2.0) */
  issuerUrl: string;
  /** Client ID registered with the IdP */
  clientId: string;
  /** Client secret (encrypted at rest) */
  clientSecret: string;
  /** OAuth scopes to request */
  scopes: string[];
  /** Redirect URI registered with the IdP */
  redirectUri: string;
  /** Whether to use PKCE flow */
  usePkce: boolean;
  /** Claim mapping from OIDC claims to user fields */
  claimMapping: OidcClaimMapping;
  /** Whether this provider is active */
  isActive: boolean;
  /** Whether to use discovery endpoint */
  useDiscovery: boolean;
  /** Manual authorization endpoint (if not using discovery) */
  authorizationEndpoint?: string;
  /** Manual token endpoint (if not using discovery) */
  tokenEndpoint?: string;
  /** Manual userinfo endpoint (if not using discovery) */
  userinfoEndpoint?: string;
  /** Manual JWKS URI (if not using discovery) */
  jwksUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OidcProvider {
  private props: OidcProviderProps;

  private constructor(props: OidcProviderProps) {
    this.props = props;
  }

  static create(params: {
    providerId: string;
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
  }): OidcProvider {
    if (!params.organizationId?.trim()) throw new SsoValidationError('Organization ID is required');
    if (!params.name?.trim()) throw new SsoValidationError('Provider name is required');
    if (!params.issuerUrl?.trim()) throw new SsoValidationError('Issuer URL is required');
    if (!params.clientId?.trim()) throw new SsoValidationError('Client ID is required');
    if (!params.clientSecret?.trim()) throw new SsoValidationError('Client secret is required');
    if (!params.redirectUri?.trim()) throw new SsoValidationError('Redirect URI is required');

    const useDiscovery = params.useDiscovery ?? true;
    if (!useDiscovery) {
      if (!params.authorizationEndpoint) throw new SsoValidationError('Authorization endpoint is required when discovery is disabled');
      if (!params.tokenEndpoint) throw new SsoValidationError('Token endpoint is required when discovery is disabled');
      if (!params.userinfoEndpoint) throw new SsoValidationError('Userinfo endpoint is required when discovery is disabled');
    }

    const now = new Date();
    return new OidcProvider({
      providerId: params.providerId,
      organizationId: params.organizationId,
      name: params.name,
      issuerUrl: params.issuerUrl,
      clientId: params.clientId,
      clientSecret: params.clientSecret,
      scopes: params.scopes || ['openid', 'email', 'profile'],
      redirectUri: params.redirectUri,
      usePkce: params.usePkce ?? true,
      useDiscovery,
      authorizationEndpoint: params.authorizationEndpoint,
      tokenEndpoint: params.tokenEndpoint,
      userinfoEndpoint: params.userinfoEndpoint,
      jwksUri: params.jwksUri,
      claimMapping: {
        email: params.claimMapping?.email || 'email',
        firstName: params.claimMapping?.firstName || 'given_name',
        lastName: params.claimMapping?.lastName || 'family_name',
        displayName: params.claimMapping?.displayName || 'name',
        extra: params.claimMapping?.extra,
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: OidcProviderProps): OidcProvider {
    return new OidcProvider(props);
  }

  // Getters
  get providerId(): string { return this.props.providerId; }
  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get issuerUrl(): string { return this.props.issuerUrl; }
  get clientId(): string { return this.props.clientId; }
  get clientSecret(): string { return this.props.clientSecret; }
  get scopes(): string[] { return this.props.scopes; }
  get redirectUri(): string { return this.props.redirectUri; }
  get usePkce(): boolean { return this.props.usePkce; }
  get useDiscovery(): boolean { return this.props.useDiscovery; }
  get authorizationEndpoint(): string | undefined { return this.props.authorizationEndpoint; }
  get tokenEndpoint(): string | undefined { return this.props.tokenEndpoint; }
  get userinfoEndpoint(): string | undefined { return this.props.userinfoEndpoint; }
  get jwksUri(): string | undefined { return this.props.jwksUri; }
  get claimMapping(): OidcClaimMapping { return this.props.claimMapping; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Domain methods
  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  updateClientSecret(secret: string): void {
    if (!secret?.trim()) throw new SsoValidationError('Client secret is required');
    this.props.clientSecret = secret;
    this.touch();
  }

  updateClaimMapping(mapping: Partial<OidcClaimMapping>): void {
    this.props.claimMapping = {
      ...this.props.claimMapping,
      ...mapping,
    };
    this.touch();
  }

  updateConfig(params: {
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
  }): void {
    if (params.name !== undefined) this.props.name = params.name;
    if (params.issuerUrl !== undefined) this.props.issuerUrl = params.issuerUrl;
    if (params.clientId !== undefined) this.props.clientId = params.clientId;
    if (params.clientSecret !== undefined) this.props.clientSecret = params.clientSecret;
    if (params.scopes !== undefined) this.props.scopes = params.scopes;
    if (params.redirectUri !== undefined) this.props.redirectUri = params.redirectUri;
    if (params.usePkce !== undefined) this.props.usePkce = params.usePkce;
    if (params.useDiscovery !== undefined) this.props.useDiscovery = params.useDiscovery;
    if (params.authorizationEndpoint !== undefined) this.props.authorizationEndpoint = params.authorizationEndpoint;
    if (params.tokenEndpoint !== undefined) this.props.tokenEndpoint = params.tokenEndpoint;
    if (params.userinfoEndpoint !== undefined) this.props.userinfoEndpoint = params.userinfoEndpoint;
    if (params.jwksUri !== undefined) this.props.jwksUri = params.jwksUri;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      providerId: this.props.providerId,
      organizationId: this.props.organizationId,
      name: this.props.name,
      issuerUrl: this.props.issuerUrl,
      clientId: this.props.clientId,
      hasClientSecret: !!this.props.clientSecret,
      scopes: this.props.scopes,
      redirectUri: this.props.redirectUri,
      usePkce: this.props.usePkce,
      useDiscovery: this.props.useDiscovery,
      authorizationEndpoint: this.props.authorizationEndpoint,
      tokenEndpoint: this.props.tokenEndpoint,
      userinfoEndpoint: this.props.userinfoEndpoint,
      jwksUri: this.props.jwksUri,
      claimMapping: this.props.claimMapping,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
