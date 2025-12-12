import { AxiosInstance } from 'axios';
import { setupLocalizationTests, cleanupLocalizationTests, createTestLanguage, createTestLocale } from './testUtils';

describe('Localization Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    languageCodes: [] as string[],
    localeCodes: [] as string[]
  };

  beforeAll(async () => {
    const setup = await setupLocalizationTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupLocalizationTests(client, adminToken, createdResources);
  });

  // ============================================================================
  // Language Management Tests (UC-LOC-001 to UC-LOC-004)
  // ============================================================================

  describe('Language Management', () => {
    let testLanguageCode: string;

    it('UC-LOC-002: should create a language', async () => {
      const languageData = createTestLanguage();

      const response = await client.post('/business/languages', languageData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('code');

      testLanguageCode = response.data.data.code;
      createdResources.languageCodes.push(testLanguageCode);
    });

    it('UC-LOC-001: should list languages', async () => {
      const response = await client.get('/business/languages', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-LOC-003: should update a language', async () => {
      const updateData = { name: 'Updated Language Name' };

      const response = await client.put(`/business/languages/${testLanguageCode}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Translation Management Tests (UC-LOC-005 to UC-LOC-010)
  // ============================================================================

  describe('Translation Management', () => {
    const testKey = `test.key.${Date.now()}`;

    it('UC-LOC-007: should create/update a translation', async () => {
      const response = await client.put(`/business/translations/${testKey}`, {
        languageCode: 'en',
        value: 'Test translation value',
        namespace: 'common'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-LOC-005: should list translations', async () => {
      const response = await client.get('/business/translations', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { languageCode: 'en' }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-LOC-006: should get a specific translation', async () => {
      const response = await client.get(`/business/translations/${testKey}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { languageCode: 'en' }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-LOC-010: should export translations', async () => {
      const response = await client.get('/business/translations/export', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { languageCode: 'en', format: 'json' }
      });

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // Locale Management Tests (UC-LOC-011 to UC-LOC-014)
  // ============================================================================

  describe('Locale Management', () => {
    let testLocaleCode: string;

    it('UC-LOC-012: should create a locale', async () => {
      const localeData = createTestLocale('en');

      const response = await client.post('/business/locales', localeData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('code');

      testLocaleCode = response.data.data.code;
      createdResources.localeCodes.push(testLocaleCode);
    });

    it('UC-LOC-011: should list locales', async () => {
      const response = await client.get('/business/locales', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-LOC-013: should update a locale', async () => {
      const updateData = { dateFormat: 'DD/MM/YYYY' };

      const response = await client.put(`/business/locales/${testLocaleCode}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Customer-Facing Tests (UC-LOC-015 to UC-LOC-017)
  // ============================================================================

  describe('Customer-Facing Localization', () => {
    it('UC-LOC-015: should get available languages (public)', async () => {
      const response = await client.get('/api/localization/languages');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-LOC-016: should get translations for a language (public)', async () => {
      const response = await client.get('/api/localization/translations/en');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-LOC-017: should detect locale', async () => {
      const response = await client.get('/api/localization/detect');

      // May return 200 with detected locale or default
      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for admin language management', async () => {
      const response = await client.post('/business/languages', {});
      expect([401, 403]).toContain(response.status);
    });

    it('should allow public access to translations', async () => {
      const response = await client.get('/api/localization/languages');
      expect(response.status).toBe(200);
    });
  });
});
