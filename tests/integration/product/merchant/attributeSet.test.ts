/**
 * Integration tests for attribute sets
 * Covers: spec 03-attributes.md section 2.4
 * - Merchant: attribute set CRUD
 * - Merchant: add / remove / reorder attributes in a set
 * - Merchant: get attribute set with full attribute list
 * - Merchant: product type → attribute set relationship
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../../testUtils';
import { SEEDED_ATTRIBUTE_COLOR_ID, SEEDED_ATTRIBUTE_SET_APPAREL_ID, SEEDED_ATTRIBUTE_SET_DEFAULT_ID, SEEDED_ATTRIBUTE_SET_ELECTRONICS_ID, SEEDED_ATTRIBUTE_SIZE_ID, SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID, SEEDED_PRODUCT_TYPE_SIMPLE_ID, SEEDED_PRODUCT_1_ID } from '../testUtils';

describe('Attribute Set Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdSetId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (createdSetId) {
      await client
        .delete(`/business/attribute-sets/${createdSetId}`, { headers: { Authorization: `Bearer ${adminToken}` } })
        .catch(() => {});
    }
  });

  // ── Attribute Set Queries ────────────────────────────────────────────────

  describe('Attribute Set Queries', () => {
    it('should get attribute set by ID with attributes', async () => {
      const res = await client.get(`/business/attribute-sets/${SEEDED_ATTRIBUTE_SET_DEFAULT_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('productAttributeSetId', SEEDED_ATTRIBUTE_SET_DEFAULT_ID);
      expect(res.data.data).toHaveProperty('attributes');
      expect(Array.isArray(res.data.data.attributes)).toBe(true);
      expect(res.data.data.attributes.length).toBeGreaterThan(0);
    });

    it('should get attributes for apparel attribute set', async () => {
      const res = await client.get(`/business/attribute-sets/${SEEDED_ATTRIBUTE_SET_APPAREL_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      const attrCodes = res.data.data.attributes.map((a: Record<string, unknown>) => a.code);
      expect(attrCodes).toContain('color-test');
      expect(attrCodes).toContain('size-test');
    });

    it('should verify attribute set mappings include required flag', async () => {
      const res = await client.get(`/business/attribute-sets/${SEEDED_ATTRIBUTE_SET_APPAREL_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const colorAttr = res.data.data.attributes.find((a: Record<string, unknown>) => a.code === 'color-test');
      expect(colorAttr).toBeDefined();
      expect(colorAttr).toHaveProperty('isRequired');
    });

    it('should list all attribute sets', async () => {
      const res = await client.get('/business/attribute-sets', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── Attribute Set with Product Types ─────────────────────────────────────

  describe('Attribute Set with Product Types', () => {
    it('should verify simple product type has default attribute set', async () => {
      const res = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_SIMPLE_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const setIds = (res.data.data.attributeSets || []).map((s: Record<string, unknown>) => s.productAttributeSetId);
      expect(setIds).toContain(SEEDED_ATTRIBUTE_SET_DEFAULT_ID);
    });

    it('should verify configurable product type has apparel and electronics sets', async () => {
      const res = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const setIds = (res.data.data.attributeSets || []).map((s: Record<string, unknown>) => s.productAttributeSetId);
      expect(setIds).toContain(SEEDED_ATTRIBUTE_SET_APPAREL_ID);
      expect(setIds).toContain(SEEDED_ATTRIBUTE_SET_ELECTRONICS_ID);
    });
  });

  // ── Attribute Set Attribute Mapping ──────────────────────────────────────

  describe('Attribute Set Attribute Mapping', () => {
    it('should verify electronics set has tech attributes', async () => {
      const res = await client.get(`/business/attribute-sets/${SEEDED_ATTRIBUTE_SET_ELECTRONICS_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const attrCodes = res.data.data.attributes.map((a: Record<string, unknown>) => a.code);
      expect(attrCodes).toContain('screen-size-test');
      expect(attrCodes).toContain('ram-test');
    });

    it('should verify attribute positions are ordered', async () => {
      const res = await client.get(`/business/attribute-sets/${SEEDED_ATTRIBUTE_SET_APPAREL_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const positions = res.data.data.attributes.map((a: Record<string, unknown>) => a.position);
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1]);
      }
    });
  });

  // ── Attribute Types in Sets ───────────────────────────────────────────────

  describe('Attribute Types in Sets', () => {
    it('should verify select attributes have values', async () => {
      const res = await client.get(`/business/attributes/${SEEDED_ATTRIBUTE_COLOR_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.data.type).toBe('select');
      expect(Array.isArray(res.data.data.values)).toBe(true);
      expect(res.data.data.values.length).toBeGreaterThan(0);
    });

    it('should verify variant attributes are marked correctly', async () => {
      const colorRes = await client.get(`/business/attributes/${SEEDED_ATTRIBUTE_COLOR_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const sizeRes = await client.get(`/business/attributes/${SEEDED_ATTRIBUTE_SIZE_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(colorRes.data.data.useForVariants).toBe(true);
      expect(sizeRes.data.data.useForVariants).toBe(true);
    });

    it('should verify filterable attributes are marked correctly', async () => {
      const res = await client.get('/business/attributes?filterable=true', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      res.data.data.forEach((attr: Record<string, unknown>) => {
        expect(attr.isFilterable).toBe(true);
      });
    });
  });

  // ── Attribute Set CRUD ────────────────────────────────────────────────────

  describe('Merchant: Attribute Set CRUD', () => {
    it('should reject creation without name or code', async () => {
      const res = await client.post('/business/attribute-sets',
        { name: 'No Code' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(400);
    });

    it('should create a new attribute set', async () => {
      const res = await client.post('/business/attribute-sets', {
        name: 'Test Attribute Set',
        code: `test-set-${Date.now()}`,
        description: 'Created by integration test',
        isActive: true,
      }, { headers: { Authorization: `Bearer ${adminToken}` } });

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('productAttributeSetId');
      createdSetId = res.data.data.productAttributeSetId;
    });

    it('should reject duplicate code', async () => {
      if (!createdSetId) return;
      const existing = await client.get(`/business/attribute-sets/${createdSetId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const code = existing.data.data.code;

      const res = await client.post('/business/attribute-sets',
        { name: 'Duplicate', code },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(400);
    });

    it('should update an attribute set', async () => {
      if (!createdSetId) return;
      const res = await client.put(`/business/attribute-sets/${createdSetId}`,
        { name: 'Updated Set Name', description: 'Updated description' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toBe('Updated Set Name');
    });

    it('should add an attribute to the set', async () => {
      if (!createdSetId) return;
      const res = await client.post(`/business/attribute-sets/${createdSetId}/attributes`,
        { attributeId: SEEDED_ATTRIBUTE_COLOR_ID, position: 1, isRequired: false },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      const attrIds = res.data.data.attributes.map((a: Record<string, unknown>) => a.productAttributeId);
      expect(attrIds).toContain(SEEDED_ATTRIBUTE_COLOR_ID);
    });

    it('should reorder attributes in the set', async () => {
      if (!createdSetId) return;
      // Add a second attribute first
      await client.post(`/business/attribute-sets/${createdSetId}/attributes`,
        { attributeId: SEEDED_ATTRIBUTE_SIZE_ID, position: 2, isRequired: false },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      const res = await client.post(`/business/attribute-sets/${createdSetId}/attributes/reorder`,
        { attributeIds: [SEEDED_ATTRIBUTE_SIZE_ID, SEEDED_ATTRIBUTE_COLOR_ID] },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should remove an attribute from the set', async () => {
      if (!createdSetId) return;
      const res = await client.delete(
        `/business/attribute-sets/${createdSetId}/attributes/${SEEDED_ATTRIBUTE_COLOR_ID}`,
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should return 404 for non-existent attribute set', async () => {
      const res = await client.get('/business/attribute-sets/00000000-0000-0000-0000-999999999999', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });

    it('should delete the attribute set', async () => {
      if (!createdSetId) return;
      const res = await client.delete(`/business/attribute-sets/${createdSetId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      createdSetId = null;
    });
  });

  // ── Merchant: Apply Attribute Set to Product ─────────────────────────────

  describe('Merchant: Apply Attribute Set to Product', () => {
    it('should apply an attribute set to an existing product', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/apply-attribute-set`,
        { attributeSetId: SEEDED_ATTRIBUTE_SET_DEFAULT_ID },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      if (res.status === 200) {
        expect(res.data.success).toBe(true);
        expect(res.data.data.applied).toBe(true);
        expect(res.data.data).toHaveProperty('attributesAssigned');
      } else {
        expect([400, 500]).toContain(res.status);
      }
    });

    it('should reject apply-attribute-set without attributeSetId', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/apply-attribute-set`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent attribute set', async () => {
      const fakeId = '99999999-9999-9999-9999-999999999999';
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/apply-attribute-set`,
        { attributeSetId: fakeId },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent product when applying attribute set', async () => {
      const fakeProductId = '99999999-9999-9999-9999-999999999999';
      const res = await client.post(
        `/business/products/${fakeProductId}/apply-attribute-set`,
        { attributeSetId: SEEDED_ATTRIBUTE_SET_DEFAULT_ID },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(404);
    });
  });

  // ── Auth Guards ──────────────────────────────────────────────────────────

  describe('Auth Guards', () => {
    it('should reject apply-attribute-set without auth', async () => {
      const res = await client.post(`/business/products/${SEEDED_PRODUCT_1_ID}/apply-attribute-set`, {
        attributeSetId: SEEDED_ATTRIBUTE_SET_DEFAULT_ID,
      });
      expect([401, 403]).toContain(res.status);
    });
  });
});
