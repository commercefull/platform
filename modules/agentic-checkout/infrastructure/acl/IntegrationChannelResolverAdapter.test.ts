/**
 * Tests for IntegrationChannelResolverAdapter — resolves Bearer keys to channel
 * contexts via the integration module's encrypted credentials, and verifies
 * HMAC-SHA256 request signatures when a signing secret is configured.
 */

import { createHmac } from 'crypto';
import { Integration } from '../../../integration/domain/entities/Integration';
import { IntegrationCredential } from '../../../integration/domain/entities/IntegrationCredential';
import { encryptCredential } from '../../../integration/domain/services/CredentialCrypto';
import type {
  IntegrationRepository,
  IntegrationCredentialRepository,
} from '../../../integration/domain/repositories/IntegrationRepository';
import { IntegrationChannelResolverAdapter } from './IntegrationChannelResolverAdapter';

const TEST_KEY = 'a'.repeat(64);
const API_KEY = 'acp-test-key-12345';
const SIGNING_SECRET = 'acp-test-signing-secret';
const INTEGRATION_ID = 'int-1';
const ORG_ID = 'org-1';
const STORE_ID = 'store-1';

function makeIntegration(config: Record<string, unknown> = {}): Integration {
  const integration = Integration.create({
    integrationId: INTEGRATION_ID,
    organizationId: ORG_ID,
    name: 'Test ACP Channel',
    provider: 'acp',
    config: { storeId: STORE_ID, surface: 'chatgpt', currency: 'USD', ...config },
  });
  integration.activate();
  return integration;
}

function makeCredential(data: Record<string, unknown>): IntegrationCredential {
  const enc = encryptCredential(data);
  return IntegrationCredential.create({
    credentialId: 'cred-1',
    integrationId: INTEGRATION_ID,
    type: 'api_key',
    label: 'ACP channel key',
    encryptedData: enc.encryptedData,
    iv: enc.iv,
    authTag: enc.authTag,
  });
}

describe('IntegrationChannelResolverAdapter', () => {
  const integrationRepo = {
    findByProvider: jest.fn(),
  } as unknown as jest.Mocked<Pick<IntegrationRepository, 'findByProvider'>>;
  const credentialRepo = {
    findActiveByIntegration: jest.fn(),
  } as unknown as jest.Mocked<Pick<IntegrationCredentialRepository, 'findActiveByIntegration'>>;
  const adapter = new IntegrationChannelResolverAdapter(integrationRepo, credentialRepo);

  beforeAll(() => {
    process.env.INTEGRATION_ENCRYPTION_KEY = TEST_KEY;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    integrationRepo.findByProvider.mockResolvedValue([makeIntegration()]);
    credentialRepo.findActiveByIntegration.mockResolvedValue([makeCredential({ apiKey: API_KEY, webhookSecret: SIGNING_SECRET })]);
  });

  describe('resolveByApiKey', () => {
    it('should resolve a matching bearer key to the channel context', async () => {
      const channel = await adapter.resolveByApiKey(API_KEY);

      expect(channel).toEqual({
        integrationId: INTEGRATION_ID,
        organizationId: ORG_ID,
        storeId: STORE_ID,
        surface: 'chatgpt',
        currency: 'USD',
      });
    });

    it('should return null when no credential matches the key', async () => {
      const channel = await adapter.resolveByApiKey('wrong-key');

      expect(channel).toBeNull();
    });

    it('should only scan active integrations and stop at the first key match', async () => {
      await adapter.resolveByApiKey(API_KEY);

      expect(integrationRepo.findByProvider).toHaveBeenCalledWith('acp', { status: 'active' });
      // Short-circuits on the first match — later providers are not queried
      expect(integrationRepo.findByProvider).toHaveBeenCalledTimes(1);
    });

    it('should continue scanning other channel providers when earlier ones have no match', async () => {
      integrationRepo.findByProvider.mockImplementation(async provider => (provider === 'google' ? [makeIntegration()] : []));

      const channel = await adapter.resolveByApiKey(API_KEY);

      expect(channel?.integrationId).toBe(INTEGRATION_ID);
      expect(integrationRepo.findByProvider).toHaveBeenCalledWith('google', { status: 'active' });
    });

    it('should return null when the channel integration has no storeId configured', async () => {
      integrationRepo.findByProvider.mockResolvedValue([makeIntegration({ storeId: undefined })]);

      const channel = await adapter.resolveByApiKey(API_KEY);

      expect(channel).toBeNull();
    });

    it('should return null when no integrations exist for channel providers', async () => {
      integrationRepo.findByProvider.mockResolvedValue([]);

      expect(await adapter.resolveByApiKey(API_KEY)).toBeNull();
    });
  });

  describe('verifySignature', () => {
    const rawBody = Buffer.from(JSON.stringify({ items: [] }));

    function sign(timestamp: string, body: Buffer = rawBody, secret: string = SIGNING_SECRET): string {
      return createHmac('sha256', secret)
        .update(`${timestamp}.${body.toString('utf8')}`)
        .digest('hex');
    }

    function nowTs(): string {
      return Math.floor(Date.now() / 1000).toString();
    }

    it('should accept a valid HMAC signature over timestamp + raw body', async () => {
      const ts = nowTs();
      const ok = await adapter.verifySignature({
        integrationId: INTEGRATION_ID,
        signature: sign(ts),
        timestamp: ts,
        rawBody,
      });
      expect(ok).toBe(true);
    });

    it('should accept prefixed signature formats (v1= / sha256=)', async () => {
      const ts = nowTs();
      for (const prefix of ['v1,', 'sha256=']) {
        const ok = await adapter.verifySignature({
          integrationId: INTEGRATION_ID,
          signature: `${prefix}${sign(ts)}`,
          timestamp: ts,
          rawBody,
        });
        expect(ok).toBe(true);
      }
    });

    it('should accept millisecond timestamps', async () => {
      const ts = Date.now().toString();
      const ok = await adapter.verifySignature({
        integrationId: INTEGRATION_ID,
        signature: sign(ts),
        timestamp: ts,
        rawBody,
      });
      expect(ok).toBe(true);
    });

    it('should reject a signature computed over a different body', async () => {
      const ts = nowTs();
      const ok = await adapter.verifySignature({
        integrationId: INTEGRATION_ID,
        signature: sign(ts, Buffer.from('{"tampered":true}')),
        timestamp: ts,
        rawBody,
      });
      expect(ok).toBe(false);
    });

    it('should reject when signature or timestamp headers are missing', async () => {
      const ts = nowTs();
      expect(await adapter.verifySignature({ integrationId: INTEGRATION_ID, signature: undefined, timestamp: ts, rawBody })).toBe(false);
      expect(await adapter.verifySignature({ integrationId: INTEGRATION_ID, signature: sign(ts), timestamp: undefined, rawBody })).toBe(
        false,
      );
    });

    it('should reject timestamps outside the 5-minute freshness window', async () => {
      const stale = Math.floor((Date.now() - 10 * 60 * 1000) / 1000).toString();
      const ok = await adapter.verifySignature({
        integrationId: INTEGRATION_ID,
        signature: sign(stale),
        timestamp: stale,
        rawBody,
      });
      expect(ok).toBe(false);
    });

    it('should not enforce signatures when the channel has no signing secret', async () => {
      credentialRepo.findActiveByIntegration.mockResolvedValueOnce([makeCredential({ apiKey: API_KEY })]);

      const ok = await adapter.verifySignature({
        integrationId: INTEGRATION_ID,
        signature: undefined,
        timestamp: undefined,
        rawBody,
      });
      expect(ok).toBe(true);
    });
  });
});
