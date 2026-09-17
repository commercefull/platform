/**
 * SSO Business API Integration Tests
 *
 * Tests for the SSO configuration endpoints (business side):
 * - GET    /business/sso/providers                        — list SSO providers
 * - POST   /business/sso/saml/providers                   — create SAML provider
 * - GET    /business/sso/saml/providers/:providerId       — get SAML provider
 * - PUT    /business/sso/saml/providers/:providerId       — update SAML provider
 * - DELETE /business/sso/saml/providers/:providerId       — delete SAML provider
 * - POST   /business/sso/saml/providers/:providerId/activate   — activate SAML provider
 * - POST   /business/sso/saml/providers/:providerId/deactivate — deactivate SAML provider
 * - POST   /business/sso/oidc/providers                   — create OIDC provider
 * - GET    /business/sso/oidc/providers/:providerId       — get OIDC provider
 * - PUT    /business/sso/oidc/providers/:providerId       — update OIDC provider
 * - DELETE /business/sso/oidc/providers/:providerId       — delete OIDC provider
 * - POST   /business/sso/oidc/providers/:providerId/activate   — activate OIDC provider
 * - POST   /business/sso/oidc/providers/:providerId/deactivate — deactivate OIDC provider
 * - POST   /business/sso/saml/login/:providerId           — initiate SAML login (public)
 * - POST   /business/sso/saml/callback/:providerId        — SAML ACS callback (public)
 * - POST   /business/sso/oidc/login/:providerId           — initiate OIDC login (public)
 * - POST   /business/sso/oidc/callback/:providerId        — OIDC callback (public)
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { randomUUID } from 'node:crypto';

describe('SSO Business API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let samlProviderId: string | undefined;
  let oidcProviderId: string | undefined;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ==========================================================================
  // SAML Provider CRUD
  // ==========================================================================

  describe('POST /business/sso/saml/providers', () => {
    it('should create a SAML provider', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/sso/saml/providers',
        {
          name: `Test SAML ${Date.now()}`,
          entityId: 'https://idp.example.com/entity',
          ssoUrl: 'https://idp.example.com/sso',
          certificate: 'MIIBtest-certificate',
          spEntityId: 'https://sp.example.com/entity',
          acsUrl: 'https://sp.example.com/acs',
          binding: 'redirect',
          nameIdFormat: 'emailAddress',
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();

      if (response.status === 201) {
        samlProviderId = response.data.data?.providerId || response.data.data?.id;
      }
    });

    it('should reject requests without auth token', async () => {
      const response = await client.post('/business/sso/saml/providers', { name: 'No Auth' });

      expectStatus(response, 401);
    });
  });

  describe('GET /business/sso/providers', () => {
    it('should list SSO providers', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/sso/providers', { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('saml');
      expect(response.data.data).toHaveProperty('oidc');
    });

    it('should reject requests without auth token', async () => {
      const response = await client.get('/business/sso/providers');

      expectStatus(response, 401);
    });
  });

  describe('GET /business/sso/saml/providers/:providerId', () => {
    it('should get a SAML provider by ID', async () => {
      if (!adminToken || !samlProviderId) return;

      const response = await client.get(`/business/sso/saml/providers/${samlProviderId}`, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for non-existent SAML provider', async () => {
      if (!adminToken) return;

      const response = await client.get(`/business/sso/saml/providers/${randomUUID()}`, { headers: authHeaders() });

      expectStatus(response, 404);
    });
  });

  describe('PUT /business/sso/saml/providers/:providerId', () => {
    it('should update a SAML provider', async () => {
      if (!adminToken || !samlProviderId) return;

      const response = await client.put(
        `/business/sso/saml/providers/${samlProviderId}`,
        { name: `Updated SAML ${Date.now()}`, sloUrl: 'https://idp.example.com/slo' },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return error for non-existent SAML provider', async () => {
      if (!adminToken) return;

      const response = await client.put(
        `/business/sso/saml/providers/${randomUUID()}`,
        { name: 'Nope' },
        { headers: authHeaders() },
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /business/sso/saml/providers/:providerId/activate', () => {
    it('should activate a SAML provider', async () => {
      if (!adminToken || !samlProviderId) return;

      const response = await client.post(
        `/business/sso/saml/providers/${samlProviderId}/activate`,
        {},
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return error for non-existent provider', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/sso/saml/providers/${randomUUID()}/activate`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /business/sso/saml/providers/:providerId/deactivate', () => {
    it('should deactivate a SAML provider', async () => {
      if (!adminToken || !samlProviderId) return;

      const response = await client.post(
        `/business/sso/saml/providers/${samlProviderId}/deactivate`,
        {},
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('DELETE /business/sso/saml/providers/:providerId', () => {
    it('should delete a SAML provider', async () => {
      if (!adminToken || !samlProviderId) return;

      const response = await client.delete(`/business/sso/saml/providers/${samlProviderId}`, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      samlProviderId = undefined;
    });

    it('should return error for non-existent provider', async () => {
      if (!adminToken) return;

      const response = await client.delete(`/business/sso/saml/providers/${randomUUID()}`, { headers: authHeaders() });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });
  });

  // ==========================================================================
  // OIDC Provider CRUD
  // ==========================================================================

  describe('POST /business/sso/oidc/providers', () => {
    it('should create an OIDC provider', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/sso/oidc/providers',
        {
          name: `Test OIDC ${Date.now()}`,
          issuerUrl: 'https://idp.example.com',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'https://sp.example.com/callback',
          scopes: ['openid', 'profile', 'email'],
          useDiscovery: false,
          authorizationEndpoint: 'https://idp.example.com/authorize',
          tokenEndpoint: 'https://idp.example.com/token',
          userinfoEndpoint: 'https://idp.example.com/userinfo',
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();

      if (response.status === 201) {
        oidcProviderId = response.data.data?.providerId || response.data.data?.id;
      }
    });

    it('should reject requests without auth token', async () => {
      const response = await client.post('/business/sso/oidc/providers', { name: 'No Auth' });

      expectStatus(response, 401);
    });
  });

  describe('GET /business/sso/oidc/providers/:providerId', () => {
    it('should get an OIDC provider by ID', async () => {
      if (!adminToken || !oidcProviderId) return;

      const response = await client.get(`/business/sso/oidc/providers/${oidcProviderId}`, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for non-existent OIDC provider', async () => {
      if (!adminToken) return;

      const response = await client.get(`/business/sso/oidc/providers/${randomUUID()}`, { headers: authHeaders() });

      expectStatus(response, 404);
    });
  });

  describe('PUT /business/sso/oidc/providers/:providerId', () => {
    it('should update an OIDC provider', async () => {
      if (!adminToken || !oidcProviderId) return;

      const response = await client.put(
        `/business/sso/oidc/providers/${oidcProviderId}`,
        { name: `Updated OIDC ${Date.now()}`, scopes: ['openid', 'email'] },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return error for non-existent OIDC provider', async () => {
      if (!adminToken) return;

      const response = await client.put(
        `/business/sso/oidc/providers/${randomUUID()}`,
        { name: 'Nope' },
        { headers: authHeaders() },
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /business/sso/oidc/providers/:providerId/activate', () => {
    it('should activate an OIDC provider', async () => {
      if (!adminToken || !oidcProviderId) return;

      const response = await client.post(
        `/business/sso/oidc/providers/${oidcProviderId}/activate`,
        {},
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('POST /business/sso/oidc/providers/:providerId/deactivate', () => {
    it('should deactivate an OIDC provider', async () => {
      if (!adminToken || !oidcProviderId) return;

      const response = await client.post(
        `/business/sso/oidc/providers/${oidcProviderId}/deactivate`,
        {},
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('DELETE /business/sso/oidc/providers/:providerId', () => {
    it('should delete an OIDC provider', async () => {
      if (!adminToken || !oidcProviderId) return;

      const response = await client.delete(`/business/sso/oidc/providers/${oidcProviderId}`, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      oidcProviderId = undefined;
    });
  });

  // ==========================================================================
  // SSO Login Flows (public)
  // ==========================================================================

  // Note: although these login routes are registered before
  // isOrganizationLoggedIn inside ssoRouter, requests still pass through
  // identityBusinessRouter's blanket router.use(isOrganizationLoggedIn),
  // so unauthenticated calls return 401.

  describe('POST /business/sso/saml/login/:providerId', () => {
    it('should reject requests without auth token', async () => {
      const response = await client.post(`/business/sso/saml/login/${randomUUID()}`, {});

      expectStatus(response, 401);
    });

    it('should return error for non-existent SAML provider', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/sso/saml/login/${randomUUID()}`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /business/sso/saml/callback/:providerId', () => {
    it('should reject requests without auth token', async () => {
      const response = await client.post(`/business/sso/saml/callback/${randomUUID()}`, {});

      expectStatus(response, 401);
    });

    it('should reject callback without SAMLResponse', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/sso/saml/callback/${randomUUID()}`,
        {},
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /business/sso/oidc/login/:providerId', () => {
    it('should reject requests without auth token', async () => {
      const response = await client.post(`/business/sso/oidc/login/${randomUUID()}`, {});

      expectStatus(response, 401);
    });

    it('should return error for non-existent OIDC provider', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/sso/oidc/login/${randomUUID()}`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /business/sso/oidc/callback/:providerId', () => {
    it('should reject requests without auth token', async () => {
      const response = await client.post(`/business/sso/oidc/callback/${randomUUID()}`, {});

      expectStatus(response, 401);
    });

    it('should reject callback without authorization code', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/sso/oidc/callback/${randomUUID()}`,
        {},
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
      expect(response.data.success).toBe(false);
    });
  });
});
