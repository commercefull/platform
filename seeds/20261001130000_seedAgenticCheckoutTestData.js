/**
 * Seed Agentic Checkout Test Data
 *
 * Creates a test ACP channel integration with an encrypted api_key credential
 * so /acp endpoints can be exercised end-to-end in development and tests.
 *
 * Test credentials (intentionally fixed so tests can authenticate/sign):
 *   apiKey:        acp-test-key-12345
 *   webhookSecret: acp-test-signing-secret-67890
 *
 * Depends on: organization seed (merchant@example.com) and store test data
 * (storeId 20000000-0000-0000-0000-000000000001).
 */

const { createCipheriv, randomBytes } = require('crypto');

const TEST_ORG_EMAIL = 'merchant@example.com';
const TEST_STORE_ID = '20000000-0000-0000-0000-000000000001';
const TEST_ACP_INTEGRATION_ID = '00000000-0000-0000-0000-000000009001';
const TEST_ACP_CREDENTIAL_ID = '00000000-0000-0000-0000-000000009002';
const TEST_SALES_CHANNEL_ID = '00000000-0000-7000-8000-000000009003';

const TEST_ACP_API_KEY = 'acp-test-key-12345';
const TEST_ACP_SIGNING_SECRET = 'acp-test-signing-secret-67890';

/**
 * Mirrors modules/integration/domain/services/CredentialCrypto.ts —
 * AES-256-GCM with INTEGRATION_ENCRYPTION_KEY (hex, 32 bytes).
 */
function encryptCredential(data) {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!key || Buffer.from(key, 'hex').length !== 32) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be set (64 hex chars) to seed agentic-checkout credentials');
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const org = await knex('organization').where({ email: TEST_ORG_EMAIL }).first('organizationId');
  const store = await knex('store').where({ storeId: TEST_STORE_ID }).first('storeId');
  if (!org || !store) return;

  const hasIntegration = await knex.schema.hasTable('integration');
  const hasCredential = await knex.schema.hasTable('integrationCredential');
  const hasSalesChannel = await knex.schema.hasTable('salesChannel');
  const hasStoreSalesChannel = await knex.schema.hasTable('storeSalesChannel');
  if (!hasIntegration || !hasCredential || !hasSalesChannel || !hasStoreSalesChannel) return;

  await knex('salesChannel')
    .insert({
      salesChannelId: TEST_SALES_CHANNEL_ID,
      organizationId: org.organizationId,
      code: 'chatgpt',
      name: 'ChatGPT',
      type: 'agentic',
      status: 'active',
      config: { protocol: 'acp' },
      metadata: {},
    })
    .onConflict(['organizationId', 'code'])
    .ignore();
  const channel = await knex('salesChannel').where({ organizationId: org.organizationId, code: 'chatgpt' }).first('salesChannelId');
  if (!channel) return;
  await knex('storeSalesChannel')
    .insert({ storeId: TEST_STORE_ID, salesChannelId: channel.salesChannelId, isDefault: false, isActive: true, settings: {} })
    .onConflict(['storeId', 'salesChannelId'])
    .merge({ isActive: true });

  const existing = await knex('integration').where({ integrationId: TEST_ACP_INTEGRATION_ID }).first();
  if (existing) {
    await knex('integration')
      .where({ integrationId: TEST_ACP_INTEGRATION_ID })
      .update({
        config: { storeId: TEST_STORE_ID, salesChannelId: channel.salesChannelId, surface: 'chatgpt', currency: 'USD' },
        updatedAt: knex.fn.now(),
      });
    return;
  }

  await knex('integration').insert({
    integrationId: TEST_ACP_INTEGRATION_ID,
    organizationId: org.organizationId,
    name: 'Test ACP Channel',
    provider: 'acp',
    status: 'active',
    description: 'Seeded channel for agentic checkout tests',
    config: {
      storeId: TEST_STORE_ID,
      salesChannelId: channel.salesChannelId,
      surface: 'chatgpt',
      currency: 'USD',
    },
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now(),
  });

  const enc = encryptCredential({
    apiKey: TEST_ACP_API_KEY,
    webhookSecret: TEST_ACP_SIGNING_SECRET,
  });

  await knex('integrationCredential').insert({
    credentialId: TEST_ACP_CREDENTIAL_ID,
    integrationId: TEST_ACP_INTEGRATION_ID,
    type: 'api_key',
    label: 'ACP channel key',
    encryptedData: enc.encryptedData,
    iv: enc.iv,
    authTag: enc.authTag,
    isActive: true,
    createdAt: knex.fn.now(),
    updatedAt: knex.fn.now(),
  });
};
