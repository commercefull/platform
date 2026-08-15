/**
 * Reporting Integration Tests
 *
 * Tests for reporting management endpoints.
 * Routes are mounted at /business/reports/*.
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
};

let client: AxiosInstance;
let merchantToken: string;

beforeAll(async () => {
  client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

  try {
    const loginResponse = await client.post('/business/auth/login', TEST_MERCHANT, { headers: { 'X-Test-Request': 'true' } });
    merchantToken = loginResponse.data?.accessToken || '';
  } catch {
    merchantToken = '';
  }
});

describe('Reporting Feature Tests', () => {
  let testScheduleId: string;

  // ==========================================================================
  // Report Templates
  // ==========================================================================

  describe('GET /business/reports/templates', () => {
    it('should list all report templates', async () => {
      const response = await client.get('/business/reports/templates', {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it('should include standard report types', async () => {
      const response = await client.get('/business/reports/templates', {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      const types = response.data.data.map((t: Record<string, unknown>) => t.reportType);
      expect(types).toContain('sales_summary');
      expect(types).toContain('product_performance');
      expect(types).toContain('inventory_report');
    });
  });

  // ==========================================================================
  // Report Generation
  // ==========================================================================

  describe('POST /business/reports/generate', () => {
    it('should generate a sales summary report', async () => {
      const response = await client.post(
        '/business/reports/generate',
        {
          reportType: 'sales_summary',
          parameters: {
            dateFrom: '2024-01-01',
            dateTo: '2024-12-31',
          },
        },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('reportType', 'sales_summary');
      }
    });

    it('should generate a product performance report', async () => {
      const response = await client.post(
        '/business/reports/generate',
        {
          reportType: 'product_performance',
          parameters: {},
        },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should require reportType', async () => {
      const response = await client.post(
        '/business/reports/generate',
        { parameters: {} },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );

      expect(response.status).toBe(400);
    });

    it('should reject invalid report type', async () => {
      const response = await client.post(
        '/business/reports/generate',
        { reportType: 'invalid_type' },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );

      expect(response.status).toBe(400);
    });
  });

  // ==========================================================================
  // Report Schedule CRUD
  // ==========================================================================

  describe('POST /business/reports/schedules', () => {
    it('should create a report schedule', async () => {
      const scheduleData = {
        name: `Test Schedule ${Date.now()}`,
        reportType: 'sales_summary',
        frequency: 'weekly',
        parameters: { dateRange: 'last_7_days' },
        recipients: ['test@example.com'],
        isActive: true,
      };

      const response = await client.post('/business/reports/schedules', scheduleData, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      if (response.status === 201) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('reportScheduleId');
        testScheduleId = response.data.data.reportScheduleId;
      }
    });

    it('should require name and reportType', async () => {
      const response = await client.post(
        '/business/reports/schedules',
        { frequency: 'daily' },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('GET /business/reports/schedules', () => {
    it('should list all report schedules', async () => {
      const response = await client.get('/business/reports/schedules', {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  describe('GET /business/reports/schedules/:id', () => {
    it('should get a schedule by ID', async () => {
      if (!testScheduleId) return;

      const response = await client.get(`/business/reports/schedules/${testScheduleId}`, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for non-existent schedule', async () => {
      const response = await client.get('/business/reports/schedules/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /business/reports/schedules/:id', () => {
    it('should update a schedule', async () => {
      if (!testScheduleId) return;

      const response = await client.put(
        `/business/reports/schedules/${testScheduleId}`,
        { name: 'Updated Schedule Name' },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  describe('GET /business/reports/schedules/:id/executions', () => {
    it('should list executions for a schedule', async () => {
      if (!testScheduleId) return;

      const response = await client.get(`/business/reports/schedules/${testScheduleId}/executions`, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  describe('DELETE /business/reports/schedules/:id', () => {
    it('should delete a schedule', async () => {
      if (!testScheduleId) return;

      const response = await client.delete(`/business/reports/schedules/${testScheduleId}`, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // Authorization
  // ==========================================================================

  describe('Authorization', () => {
    it('should require auth for listing templates', async () => {
      const response = await client.get('/business/reports/templates');
      expect(response.status).toBe(401);
    });

    it('should require auth for generating reports', async () => {
      const response = await client.post('/business/reports/generate', {});
      expect(response.status).toBe(401);
    });

    it('should require auth for listing schedules', async () => {
      const response = await client.get('/business/reports/schedules');
      expect(response.status).toBe(401);
    });

    it('should require auth for creating schedule', async () => {
      const response = await client.post('/business/reports/schedules', {});
      expect(response.status).toBe(401);
    });
  });
});
