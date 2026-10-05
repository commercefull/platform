/**
 * ChannelResolverPort
 *
 * ACL port owned by agentic-checkout. Resolves inbound machine credentials
 * (ACP `Authorization: Bearer` key) to the channel context — which
 * integration, organization, and store the surface is scoped to — and
 * verifies request signatures when the channel has a signing secret.
 */

export interface ChannelContext {
  integrationId: string;
  organizationId: string;
  /** Store that represents the surface (channel: 'digital') */
  storeId: string;
  salesChannelId?: string;
  /** Human-readable surface name, e.g. 'chatgpt' */
  surface: string;
  currency?: string;
}

export interface ChannelResolverPort {
  /**
   * Resolve a Bearer API key to its channel context, or null when the key
   * is unknown / the integration is inactive.
   */
  resolveByApiKey(apiKey: string): Promise<ChannelContext | null>;

  /**
   * When the channel integration stores a signing secret, verify
   * `Signature`/`Timestamp` HMAC over the raw request body. Returns true
   * when no secret is configured (signature check not enforced).
   */
  verifySignature(params: {
    integrationId: string;
    signature: string | undefined;
    timestamp: string | undefined;
    rawBody: Buffer;
  }): Promise<boolean>;
}
