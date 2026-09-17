/**
 * SCIM 2.0 API Integration Tests
 *
 * Tests for the SCIM user provisioning endpoints (business side):
 * - GET    /business/scim/v2/Users       — list provisioned users
 * - POST   /business/scim/v2/Users       — provision a user
 * - GET    /business/scim/v2/Users/:id   — get a provisioned user
 * - PUT    /business/scim/v2/Users/:id   — replace a user
 * - PATCH  /business/scim/v2/Users/:id   — update user attributes
 * - DELETE /business/scim/v2/Users/:id   — deprovision a user
 *
 * SCIM endpoints use a dedicated bearer token (SCIM_BEARER_TOKEN env var),
 * separate from JWT auth. When the token is not configured on the server,
 * every request must be rejected with a 401 SCIM error response.
 */

import { AxiosInstance } from 'axios';
import { createTestClient, expectStatus } from '../testUtils';
import { randomUUID } from 'node:crypto';

describe('SCIM 2.0 API', () => {
  let client: AxiosInstance;

  const scimHeaders = { Authorization: 'Bearer test-scim-token' };

  beforeAll(() => {
    jest.setTimeout(30000);
    client = createTestClient();
  });

  describe('GET /business/scim/v2/Users', () => {
    it('should reject requests without a bearer token', async () => {
      const response = await client.get('/business/scim/v2/Users', {
        params: { organizationId: randomUUID() },
      });

      expectStatus(response, 401);
    });

    it('should reject requests with an invalid bearer token', async () => {
      const response = await client.get('/business/scim/v2/Users', {
        params: { organizationId: randomUUID() },
        headers: scimHeaders,
      });

      expectStatus(response, 401);
    });
  });

  describe('POST /business/scim/v2/Users', () => {
    it('should reject user provisioning without a bearer token', async () => {
      const response = await client.post('/business/scim/v2/Users', {
        organizationId: randomUUID(),
        userName: 'scim.user@example.com',
        emails: [{ value: 'scim.user@example.com', type: 'work', primary: true }],
      });

      expectStatus(response, 401);
    });

    it('should reject user provisioning with an invalid bearer token', async () => {
      const response = await client.post(
        '/business/scim/v2/Users',
        {
          organizationId: randomUUID(),
          userName: 'scim.user@example.com',
          emails: [{ value: 'scim.user@example.com', type: 'work', primary: true }],
        },
        { headers: scimHeaders },
      );

      expectStatus(response, 401);
    });
  });

  describe('GET /business/scim/v2/Users/:id', () => {
    it('should reject requests without a bearer token', async () => {
      const response = await client.get(`/business/scim/v2/Users/${randomUUID()}`);

      expectStatus(response, 401);
    });
  });

  describe('PUT /business/scim/v2/Users/:id', () => {
    it('should reject requests without a bearer token', async () => {
      const response = await client.put(`/business/scim/v2/Users/${randomUUID()}`, { active: false });

      expectStatus(response, 401);
    });
  });

  describe('PATCH /business/scim/v2/Users/:id', () => {
    it('should reject requests without a bearer token', async () => {
      const response = await client.patch(`/business/scim/v2/Users/${randomUUID()}`, {
        Operations: [{ op: 'replace', path: 'active', value: false }],
      });

      expectStatus(response, 401);
    });
  });

  describe('DELETE /business/scim/v2/Users/:id', () => {
    it('should reject requests without a bearer token', async () => {
      const response = await client.delete(`/business/scim/v2/Users/${randomUUID()}`);

      expectStatus(response, 401);
    });
  });
});
