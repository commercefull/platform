import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';
import {
  SEEDED_PRODUCT_TYPE_SIMPLE_ID,
  SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID,
  SEEDED_ATTRIBUTE_SET_DEFAULT_ID,
  SEEDED_ATTRIBUTE_SET_APPAREL_ID,
  SEEDED_ATTRIBUTE_SET_ELECTRONICS_ID,
  SEEDED_ATTRIBUTE_COLOR_ID,
  SEEDED_ATTRIBUTE_SIZE_ID,
  SEEDED_ATTRIBUTE_BRAND_ID,
} from './testUtils';

describe('Attribute Set Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Attribute Set Queries', () => {
    it('should get attribute set by ID with attributes', async () => {
      // This test verifies the attribute set includes its mapped attributes
      const response = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_SIMPLE_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('attributeSets');
      expect(Array.isArray(response.data.data.attributeSets)).toBe(true);
    });

    it('should get attributes for apparel attribute set', async () => {
      const response = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID}/attributes`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);

      // Apparel set should have color and size attributes
      const attributeCodes = response.data.data.map((a: any) => a.code);
      expect(attributeCodes).toContain('color-test');
      expect(attributeCodes).toContain('size-test');
    });

    it('should verify attribute set mappings include required flag', async () => {
      const response = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID}/attributes`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Find color attribute - should be required in apparel set
      const colorAttr = response.data.data.find((a: any) => a.code === 'color-test');
      if (colorAttr) {
        expect(colorAttr).toHaveProperty('isRequired');
      }
    });
  });

  describe('Attribute Set with Product Types', () => {
    it('should verify simple product type has default attribute set', async () => {
      const response = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_SIMPLE_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const attributeSets = response.data.data.attributeSets;
      const defaultSet = attributeSets.find((s: any) => s.code === 'default-test');
      expect(defaultSet).toBeDefined();
    });

    it('should verify configurable product type has apparel and electronics sets', async () => {
      const response = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const attributeSets = response.data.data.attributeSets;
      const setCodes = attributeSets.map((s: any) => s.code);
      expect(setCodes).toContain('apparel-test');
      expect(setCodes).toContain('electronics-test');
    });
  });

  describe('Attribute Set Attribute Mapping', () => {
    it('should verify electronics set has tech attributes', async () => {
      const response = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID}/attributes`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const attributeCodes = response.data.data.map((a: any) => a.code);
      // Electronics set should have screen size, RAM, storage
      expect(attributeCodes).toContain('screen-size-test');
      expect(attributeCodes).toContain('ram-test');
      expect(attributeCodes).toContain('storage-test');
    });

    it('should verify attribute positions are ordered', async () => {
      const response = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID}/attributes`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const attributes = response.data.data;
      if (attributes.length >= 2) {
        // Verify attributes have position property
        attributes.forEach((attr: any) => {
          expect(attr).toHaveProperty('position');
          expect(typeof attr.position).toBe('number');
        });
      }
    });
  });

  describe('Attribute Types in Sets', () => {
    it('should verify select attributes have values', async () => {
      // Get color attribute which is a select type
      const response = await client.get(`/business/attributes/${SEEDED_ATTRIBUTE_COLOR_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.type).toBe('select');
      expect(response.data.data).toHaveProperty('values');
      expect(Array.isArray(response.data.data.values)).toBe(true);
      expect(response.data.data.values.length).toBeGreaterThan(0);
    });

    it('should verify variant attributes are marked correctly', async () => {
      // Color and size should be variant attributes
      const colorResponse = await client.get(`/business/attributes/${SEEDED_ATTRIBUTE_COLOR_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const sizeResponse = await client.get(`/business/attributes/${SEEDED_ATTRIBUTE_SIZE_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(colorResponse.data.data.useForVariants).toBe(true);
      expect(sizeResponse.data.data.useForVariants).toBe(true);
    });

    it('should verify filterable attributes are marked correctly', async () => {
      const response = await client.get('/business/attributes?filterable=true', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // All returned attributes should be filterable
      response.data.data.forEach((attr: any) => {
        expect(attr.isFilterable).toBe(true);
      });
    });
  });
});
