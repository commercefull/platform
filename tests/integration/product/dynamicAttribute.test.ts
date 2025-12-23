import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_ATTRIBUTE_COLOR_ID, SEEDED_ATTRIBUTE_SIZE_ID, SEEDED_ATTRIBUTE_MATERIAL_ID } from './testUtils';

describe('Dynamic Attribute System', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdAttributeId: string | null = null;
  let createdAttributeValueId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  // ==================== ATTRIBUTE CRUD ====================

  describe('Attribute CRUD Operations', () => {
    it('should list all attributes', async () => {
      const response = await client.get('/business/attributes', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a seeded attribute by ID', async () => {
      const response = await client.get(`/business/attributes/${SEEDED_ATTRIBUTE_COLOR_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.code).toBe('color-test');
      expect(response.data.data.type).toBe('select');
      expect(response.data.data.isFilterable).toBe(true);
      expect(response.data.data.useForVariants).toBe(true);
    });

    it('should get attribute by code', async () => {
      const response = await client.get('/business/attributes/code/color-test', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.productAttributeId).toBe(SEEDED_ATTRIBUTE_COLOR_ID);
    });

    it('should create a new attribute', async () => {
      const attributeData = {
        name: 'Test Dynamic Attribute',
        code: `test-dynamic-${Date.now()}`,
        description: 'Created by integration test',
        type: 'select',
        inputType: 'select',
        isRequired: false,
        isSearchable: true,
        isFilterable: true,
        isComparable: true,
        isVisibleOnFront: true,
        useForVariants: false,
        position: 100,
        options: [
          { value: 'option1', displayValue: 'Option 1', position: 1 },
          { value: 'option2', displayValue: 'Option 2', position: 2 },
        ],
      };

      const response = await client.post('/business/attributes', attributeData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('Test Dynamic Attribute');
      expect(response.data.data.isFilterable).toBe(true);

      createdAttributeId = response.data.data.productAttributeId;
    });

    it('should update an attribute', async () => {
      if (!createdAttributeId) {
        console.warn('Skipping: No attribute was created');
        return;
      }

      const updateData = {
        name: 'Updated Dynamic Attribute',
        description: 'Updated by integration test',
        isSearchable: false,
      };

      const response = await client.put(`/business/attributes/${createdAttributeId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('Updated Dynamic Attribute');
    });

    it('should list filterable attributes', async () => {
      const response = await client.get('/business/attributes?filterable=true', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      // All returned attributes should be filterable
      response.data.data.forEach((attr: any) => {
        expect(attr.isFilterable).toBe(true);
      });
    });

    it('should list variant attributes', async () => {
      const response = await client.get('/business/attributes?forVariants=true', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      // All returned attributes should be for variants
      response.data.data.forEach((attr: any) => {
        expect(attr.useForVariants).toBe(true);
      });
    });
  });

  // ==================== ATTRIBUTE VALUES ====================

  describe('Attribute Values Operations', () => {
    it('should get attribute values for a select attribute', async () => {
      const response = await client.get(`/business/attributes/${SEEDED_ATTRIBUTE_COLOR_ID}/values`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);

      // Check for expected color values
      const values = response.data.data.map((v: any) => v.value);
      expect(values).toContain('red');
      expect(values).toContain('blue');
      expect(values).toContain('black');
    });

    it('should add a new value to an attribute', async () => {
      if (!createdAttributeId) {
        console.warn('Skipping: No attribute was created');
        return;
      }

      const valueData = {
        value: 'option3',
        displayValue: 'Option 3',
        position: 3,
        isDefault: false,
      };

      const response = await client.post(`/business/attributes/${createdAttributeId}/values`, valueData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.value).toBe('option3');

      createdAttributeValueId = response.data.data.productAttributeValueId;
    });

    it('should remove a value from an attribute', async () => {
      if (!createdAttributeId || !createdAttributeValueId) {
        console.warn('Skipping: No attribute value was created');
        return;
      }

      const response = await client.delete(`/business/attributes/${createdAttributeId}/values/${createdAttributeValueId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==================== PRODUCT ATTRIBUTES ====================

  describe('Product Attribute Assignment', () => {
    it('should get attributes for a product', async () => {
      const response = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/attributes`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should set a single attribute on a product', async () => {
      const attributeData = {
        attributeId: SEEDED_ATTRIBUTE_MATERIAL_ID,
        value: 'Silk',
      };

      const response = await client.post(`/business/products/${SEEDED_PRODUCT_1_ID}/attributes`, attributeData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should set multiple attributes on a product', async () => {
      const attributesData = {
        attributes: [
          { attributeId: SEEDED_ATTRIBUTE_COLOR_ID, value: 'blue' },
          { attributeId: SEEDED_ATTRIBUTE_SIZE_ID, value: 'm' },
        ],
        clearExisting: false,
      };

      const response = await client.put(`/business/products/${SEEDED_PRODUCT_1_ID}/attributes`, attributesData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.set).toBeGreaterThanOrEqual(2);
    });

    it('should verify product attributes were set', async () => {
      const response = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/attributes`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const attributes = response.data.data;
      const colorAttr = attributes.find((a: any) => a.attributeId === SEEDED_ATTRIBUTE_COLOR_ID);
      const sizeAttr = attributes.find((a: any) => a.attributeId === SEEDED_ATTRIBUTE_SIZE_ID);

      expect(colorAttr).toBeDefined();
      expect(colorAttr.value).toBe('blue');
      expect(sizeAttr).toBeDefined();
      expect(sizeAttr.value).toBe('m');
    });

    it('should remove an attribute from a product', async () => {
      const response = await client.delete(`/business/products/${SEEDED_PRODUCT_1_ID}/attributes/${SEEDED_ATTRIBUTE_MATERIAL_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==================== CLEANUP ====================

  describe('Cleanup', () => {
    it('should delete the created attribute', async () => {
      if (!createdAttributeId) {
        console.warn('Skipping: No attribute was created');
        return;
      }

      const response = await client.delete(`/business/attributes/${createdAttributeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
});
