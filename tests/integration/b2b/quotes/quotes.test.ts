/**
 * B2B Quotes Integration Tests
 * Tests for quote CRUD operations and workflow
 */

import axios, { AxiosInstance } from 'axios';
import { ADMIN_CREDENTIALS } from '../../testConstants';

const API_BASE = '/business/b2b';

const createClient = (): AxiosInstance => axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

describe('B2B Quotes API', () => {
  let client: AxiosInstance;
  let createdCompanyId: string;
  let createdQuoteId: string;
  let createdQuoteItemId: string;

  beforeAll(async () => {
    client = createClient();
    
    // Get auth token
    const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS);
    if (loginResponse.data.accessToken) {
      client.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.accessToken}`;
    }

    // Create a test company for quotes
    const companyResponse = await client.post(`${API_BASE}/companies`, {
      name: `Quote Test Company ${Date.now()}`,
      email: `quote-test-${Date.now()}@example.com`
    });
    if (companyResponse.status === 201) {
      createdCompanyId = companyResponse.data.data.id || companyResponse.data.data.b2bCompanyId;
      
      // Approve the company so we can create quotes
      await client.post(`${API_BASE}/companies/${createdCompanyId}/approve`, {
        creditLimit: 50000
      });
    }
  });

  afterAll(async () => {
    // Cleanup
    if (createdQuoteId) {
      await client.delete(`${API_BASE}/quotes/${createdQuoteId}`);
    }
    if (createdCompanyId) {
      await client.delete(`${API_BASE}/companies/${createdCompanyId}`);
    }
  });

  describe('GET /b2b/quotes', () => {
    it('should return a list of quotes', async () => {
      const response = await client.get(`${API_BASE}/quotes`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter by company', async () => {
      if (!createdCompanyId) return;

      const response = await client.get(`${API_BASE}/quotes?companyId=${createdCompanyId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await client.get(`${API_BASE}/quotes?status=draft`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('POST /b2b/quotes', () => {
    it('should create a new quote', async () => {
      if (!createdCompanyId) return;

      const quoteData = {
        companyId: createdCompanyId,
        currency: 'USD',
        validityDays: 30,
        customerNotes: 'Test quote for integration testing'
      };

      const response = await client.post(`${API_BASE}/quotes`, quoteData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id || response.data.data.b2bQuoteId).toBeDefined();
      expect(response.data.data.status).toBe('draft');

      createdQuoteId = response.data.data.id || response.data.data.b2bQuoteId;
    });

    it('should return 400 if companyId is missing', async () => {
      const response = await client.post(`${API_BASE}/quotes`, {
        currency: 'USD'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /b2b/quotes/:id', () => {
    it('should return a quote by ID', async () => {
      if (!createdQuoteId) return;

      const response = await client.get(`${API_BASE}/quotes/${createdQuoteId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id || response.data.data.b2bQuoteId).toBe(createdQuoteId);
    });

    it('should return 404 for non-existent quote', async () => {
      const response = await client.get(`${API_BASE}/quotes/00000000-0000-0000-0000-000000000000`);

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('PUT /b2b/quotes/:id', () => {
    it('should update a quote', async () => {
      if (!createdQuoteId) return;

      const updateData = {
        customerNotes: 'Updated test notes',
        internalNotes: 'Internal note for testing'
      };

      const response = await client.put(`${API_BASE}/quotes/${createdQuoteId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Quote Items', () => {
    describe('POST /b2b/quotes/:quoteId/items', () => {
      it('should add an item to a quote', async () => {
        if (!createdQuoteId) return;

        const itemData = {
          name: 'Test Product',
          sku: 'TEST-SKU-001',
          quantity: 10,
          unitPrice: 99.99,
          unit: 'each'
        };

        const response = await client.post(`${API_BASE}/quotes/${createdQuoteId}/items`, itemData);

        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data.data.id || response.data.data.b2bQuoteItemId).toBeDefined();

        createdQuoteItemId = response.data.data.id || response.data.data.b2bQuoteItemId;
      });

      it('should return 400 if name is missing', async () => {
        if (!createdQuoteId) return;

        const response = await client.post(`${API_BASE}/quotes/${createdQuoteId}/items`, {
          quantity: 5,
          unitPrice: 50
        });

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
      });
    });

    describe('PUT /b2b/quotes/:quoteId/items/:itemId', () => {
      it('should update a quote item', async () => {
        if (!createdQuoteId || !createdQuoteItemId) return;

        const updateData = {
          quantity: 20,
          unitPrice: 89.99
        };

        const response = await client.put(
          `${API_BASE}/quotes/${createdQuoteId}/items/${createdQuoteItemId}`,
          updateData
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('DELETE /b2b/quotes/:quoteId/items/:itemId', () => {
      it('should remove an item from a quote', async () => {
        if (!createdQuoteId || !createdQuoteItemId) return;

        const response = await client.delete(
          `${API_BASE}/quotes/${createdQuoteId}/items/${createdQuoteItemId}`
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        createdQuoteItemId = '';
      });
    });
  });

  describe('POST /b2b/quotes/:id/send', () => {
    it('should send a quote to the customer', async () => {
      if (!createdQuoteId) return;

      // First add an item back to the quote
      await client.post(`${API_BASE}/quotes/${createdQuoteId}/items`, {
        name: 'Test Product for Send',
        quantity: 5,
        unitPrice: 100,
        unit: 'each'
      });

      const response = await client.post(`${API_BASE}/quotes/${createdQuoteId}/send`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('sent');
    });
  });

  describe('DELETE /b2b/quotes/:id', () => {
    it('should delete a quote', async () => {
      if (!createdQuoteId) return;

      const response = await client.delete(`${API_BASE}/quotes/${createdQuoteId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      createdQuoteId = '';
    });
  });
});
