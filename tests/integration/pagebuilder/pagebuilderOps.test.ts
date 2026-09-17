/**
 * Page Builder Operations Integration Tests
 *
 * Covers endpoints not exercised by pagebuilder.test.ts:
 * - PATCH /business/page-builder/drafts/:draftId/theme
 * - POST  /business/page-builder/drafts/:draftId/regions/:region/reorder
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Page Builder Operations Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;

  // Seeded in seeds/20241220000024_seedPagebuilderTestData.js
  const draftId = '0193d000-0000-7000-8000-000000000001';
  const blockIds = ['0193d001-0000-7000-8000-000000000001', '0193d001-0000-7000-8000-000000000002'];

  const headers = () => ({ Authorization: `Bearer ${orgToken}` });

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
    if (!orgToken) throw new Error('Failed to get org token for Page Builder tests');
  });

  it('PATCH /business/page-builder/drafts/:draftId/theme updates the theme', async () => {
    // Use an existing theme (built-in or previously created)
    const themes = await client.get('/business/theme', { headers: headers() });
    const themeId = themes.data.data?.[0]?.themeId || themes.data.data?.[0]?.id || '';
    if (!themeId) return;

    const resp = await client.patch(`/business/page-builder/drafts/${draftId}/theme`, { themeId }, { headers: headers() });
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('POST /business/page-builder/drafts/:draftId/regions/:region/reorder reorders blocks', async () => {
    // Seeded draft has two blocks in the main region
    const resp = await client.post(
      `/business/page-builder/drafts/${draftId}/regions/main/reorder`,
      { blockOrders: [{ blockId: blockIds[1], order: 0 }, { blockId: blockIds[0], order: 1 }] },
      { headers: headers() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });
});
