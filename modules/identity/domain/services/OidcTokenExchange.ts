/**
 * OIDC Token Exchange Service
 *
 * Handles the OIDC authorization code flow:
 * 1. Build authorization URL
 * 2. Exchange authorization code for tokens
 * 3. Fetch userinfo from the IdP
 *
 * In production, this would use a library like openid-client.
 * For now, we implement the flow using fetch.
 */

import crypto from 'crypto';
import { OidcProvider, OidcClaimMapping } from '../../domain/entities/OidcProvider';
import { OidcTokenError, OidcDiscoveryError } from '../../domain/errors/SsoErrors';

export interface OidcTokens {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt: Date;
  scope?: string;
}

export interface OidcUserInfo {
  sub: string;
  email: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  externalId: string;
  rawClaims: Record<string, unknown>;
}

export interface OidcDiscoveryDocument {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  jwksUri: string;
}

export class OidcTokenExchange {
  private discoveryCache: Map<string, { doc: OidcDiscoveryDocument; fetchedAt: Date }> = new Map();
  private readonly CACHE_TTL_MS = 3600000; // 1 hour

  /**
   * Build the authorization URL for the OIDC code flow.
   */
  buildAuthorizationUrl(provider: OidcProvider, state: string, codeChallenge?: string): string {
    const authEndpoint = provider.useDiscovery
      ? provider.issuerUrl
      : provider.authorizationEndpoint || provider.issuerUrl;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      scope: provider.scopes.join(' '),
      state,
    });

    if (provider.usePkce && codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    return `${authEndpoint}?${params.toString()}`;
  }

  /**
   * Generate PKCE code verifier and challenge.
   */
  generatePkcePair(): { verifier: string; challenge: string } {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    return { verifier, challenge };
  }

  /**
   * Generate a random state parameter for CSRF protection.
   */
  generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Exchange an authorization code for tokens.
   */
  async exchangeCodeForTokens(
    provider: OidcProvider,
    code: string,
    codeVerifier?: string,
  ): Promise<OidcTokens> {
    const tokenEndpoint = provider.tokenEndpoint || `${provider.issuerUrl}/token`;

    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: provider.redirectUri,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
    };

    if (provider.usePkce && codeVerifier) {
      body.code_verifier = codeVerifier;
    }

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body).toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new OidcTokenError(`Token endpoint returned ${response.status}: ${errorText}`);
      }

      const data = await response.json() as Record<string, unknown>;
      const expiresIn = data.expires_in as number;
      const expiresAt = new Date(Date.now() + (expiresIn || 3600) * 1000);

      return {
        accessToken: data.access_token as string,
        idToken: data.id_token as string | undefined,
        refreshToken: data.refresh_token as string | undefined,
        tokenType: data.token_type as string,
        expiresAt,
        scope: data.scope as string | undefined,
      };
    } catch (error) {
      if (error instanceof OidcTokenError) throw error;
      throw new OidcTokenError(`Failed to exchange code: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch userinfo from the IdP using the access token.
   */
  async fetchUserInfo(provider: OidcProvider, accessToken: string): Promise<OidcUserInfo> {
    const userinfoEndpoint = provider.userinfoEndpoint || `${provider.issuerUrl}/userinfo`;

    try {
      const response = await fetch(userinfoEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new OidcTokenError(`Userinfo endpoint returned ${response.status}`);
      }

      const claims = await response.json() as Record<string, unknown>;
      return this.mapClaimsToUserInfo(claims, provider.claimMapping);
    } catch (error) {
      if (error instanceof OidcTokenError) throw error;
      throw new OidcTokenError(`Failed to fetch userinfo: ${(error as Error).message}`);
    }
  }

  /**
   * Map OIDC claims to user info using the provider's claim mapping.
   */
  mapClaimsToUserInfo(claims: Record<string, unknown>, mapping: OidcClaimMapping): OidcUserInfo {
    const email = claims[mapping.email] as string;
    if (!email) throw new OidcTokenError('Email not found in OIDC userinfo');

    return {
      sub: claims.sub as string,
      email,
      emailVerified: claims.email_verified as boolean | undefined,
      firstName: claims[mapping.firstName] as string | undefined,
      lastName: claims[mapping.lastName] as string | undefined,
      displayName: claims[mapping.displayName] as string | undefined,
      externalId: claims.sub as string,
      rawClaims: claims,
    };
  }

  /**
   * Fetch OIDC discovery document (with caching).
   */
  async fetchDiscovery(issuerUrl: string): Promise<OidcDiscoveryDocument> {
    const cached = this.discoveryCache.get(issuerUrl);
    if (cached && Date.now() - cached.fetchedAt.getTime() < this.CACHE_TTL_MS) {
      return cached.doc;
    }

    const discoveryUrl = `${issuerUrl.replace(/\/$/, '')}/.well-known/openid-configuration`;

    try {
      const response = await fetch(discoveryUrl);
      if (!response.ok) {
        throw new OidcDiscoveryError(`Discovery endpoint returned ${response.status}`);
      }

      const doc = await response.json() as OidcDiscoveryDocument;
      this.discoveryCache.set(issuerUrl, { doc, fetchedAt: new Date() });
      return doc;
    } catch (error) {
      if (error instanceof OidcDiscoveryError) throw error;
      throw new OidcDiscoveryError(`Failed to fetch discovery document: ${(error as Error).message}`);
    }
  }
}
