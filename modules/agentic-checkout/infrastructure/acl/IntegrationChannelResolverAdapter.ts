/**
 * IntegrationChannelResolverAdapter
 *
 * ACL adapter bridging agentic-checkout's ChannelResolverPort to the
 * integration module. Channel credentials live as `integration` records
 * (provider 'acp'|'ucp'|…) with encrypted `api_key` / `webhook_secret`
 * credentials and `config.storeId` pointing at the channel's store.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import type {
  IntegrationRepository,
  IntegrationCredentialRepository,
} from '../../../integration/domain/repositories/IntegrationRepository';
import { decryptCredential } from '../../../integration/domain/services/CredentialCrypto';
import type { ChannelResolverPort, ChannelContext } from '../../application/ports/ChannelResolverPort';
import { logger } from '../../../../libs/logger';

/** Providers that can act as an agentic channel */
const CHANNEL_PROVIDERS = ['acp', 'ucp', 'meta', 'google'];

/** ACP signature freshness window — reject timestamps older than 5 minutes */
const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

export class IntegrationChannelResolverAdapter implements ChannelResolverPort {
  constructor(
    private readonly integrationRepository: Pick<IntegrationRepository, 'findByProvider'>,
    private readonly credentialRepository: Pick<IntegrationCredentialRepository, 'findActiveByIntegration'>,
  ) {}

  async resolveByApiKey(apiKey: string): Promise<ChannelContext | null> {
    for (const provider of CHANNEL_PROVIDERS) {
      const integrations = await this.integrationRepository.findByProvider(provider, { status: 'active' });
      for (const integration of integrations) {
        const credentials = await this.credentialRepository.findActiveByIntegration(integration.integrationId);
        for (const credential of credentials) {
          const data = this.decrypt(credential.encryptedData, credential.iv, credential.authTag);
          if (!data) continue;
          const storedKey = (data.apiKey ?? data.api_key ?? data.bearerToken) as string | undefined;
          if (storedKey && this.safeEqual(storedKey, apiKey)) {
            const storeId = (integration.config?.storeId ?? integration.config?.store_id) as string | undefined;
            if (!storeId) {
              logger.error('Channel integration missing config.storeId', { integrationId: integration.integrationId });
              return null;
            }
            return {
              integrationId: integration.integrationId,
              organizationId: integration.organizationId,
              storeId,
              salesChannelId: (integration.config?.salesChannelId ?? integration.config?.channelId) as string | undefined,
              surface: (integration.config?.surface as string) ?? integration.provider,
              currency: integration.config?.currency as string | undefined,
            };
          }
        }
      }
    }
    return null;
  }

  async verifySignature(params: {
    integrationId: string;
    signature: string | undefined;
    timestamp: string | undefined;
    rawBody: Buffer;
  }): Promise<boolean> {
    const credentials = await this.credentialRepository.findActiveByIntegration(params.integrationId);
    let secret: string | undefined;
    for (const credential of credentials) {
      const data = this.decrypt(credential.encryptedData, credential.iv, credential.authTag);
      const candidate = (data?.webhookSecret ?? data?.signatureSecret ?? data?.signing_secret) as string | undefined;
      if (candidate) {
        secret = candidate;
        break;
      }
    }
    // No signing secret configured → signature verification not enforced
    if (!secret) return true;

    if (!params.signature || !params.timestamp) return false;

    const ts = Number(params.timestamp);
    if (!Number.isFinite(ts)) return false;
    const tsMs = ts < 1e12 ? ts * 1000 : ts;
    if (Math.abs(Date.now() - tsMs) > MAX_TIMESTAMP_SKEW_MS) return false;

    const expected = createHmac('sha256', secret)
      .update(`${params.timestamp}.${params.rawBody.toString('utf8')}`)
      .digest('hex');

    return this.safeEqual(expected, params.signature.replace(/^v\d+,?/, '').replace(/^sha256=/, ''));
  }

  private decrypt(encryptedData: string, iv: string, authTag: string): Record<string, unknown> | null {
    try {
      return decryptCredential(encryptedData, iv, authTag);
    } catch {
      return null;
    }
  }

  private safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  }
}
