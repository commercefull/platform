/**
 * Analytics Reports Integration Tests
 * Tests for analytics reporting endpoints
 */

import axios, { AxiosInstance } from 'axios';
import { ADMIN_CREDENTIALS } from '../../testConstants';

const API_BASE = '/business/analytics';

const createClient = (): AxiosInstance => axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

describe('Analytics Reports API', () => {
  let client: AxiosInstance;

  beforeAll(async () => {
    client = createClient();
    
    // Get auth token
    const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS);
    if (loginResponse.data.accessToken) {
      client.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.accessToken}`;
    }
  });

  describe('Sales Analytics', () => {
    describe('GET /analytics/sales/dashboard', () => {
      it('should return sales dashboard data', async () => {
        const response = await client.get(`${API_BASE}/sales/dashboard`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
      });

      it('should support date range filtering', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        const endDate = new Date();

        const response = await client.get(
          `${API_BASE}/sales/dashboard?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('GET /analytics/sales/daily', () => {
      it('should return daily sales data', async () => {
        const response = await client.get(`${API_BASE}/sales/daily`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await client.get(`${API_BASE}/sales/daily?limit=10&offset=0`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });

      it('should support date range filtering', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date();

        const response = await client.get(
          `${API_BASE}/sales/daily?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });
  });

  describe('Product Analytics', () => {
    describe('GET /analytics/products', () => {
      it('should return product performance data', async () => {
        const response = await client.get(`${API_BASE}/products`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await client.get(`${API_BASE}/products?limit=10&offset=0`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('GET /analytics/products/top', () => {
      it('should return top performing products', async () => {
        const response = await client.get(`${API_BASE}/products/top`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should support metric parameter', async () => {
        const response = await client.get(`${API_BASE}/products/top?metric=revenue`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });

      it('should support limit parameter', async () => {
        const response = await client.get(`${API_BASE}/products/top?limit=5`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.length).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Search Analytics', () => {
    describe('GET /analytics/search', () => {
      it('should return search analytics data', async () => {
        const response = await client.get(`${API_BASE}/search`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await client.get(`${API_BASE}/search?limit=10&offset=0`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('GET /analytics/search/zero-results', () => {
      it('should return zero result searches', async () => {
        const response = await client.get(`${API_BASE}/search/zero-results`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });
  });

  describe('Customer Analytics', () => {
    describe('GET /analytics/customers/cohorts', () => {
      it('should return customer cohort data', async () => {
        const response = await client.get(`${API_BASE}/customers/cohorts`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });
  });

  describe('Event Tracking', () => {
    describe('GET /analytics/events', () => {
      it('should return tracked events', async () => {
        const response = await client.get(`${API_BASE}/events`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('GET /analytics/events/counts', () => {
      it('should return event counts', async () => {
        const response = await client.get(`${API_BASE}/events/counts`);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });
  });
});
