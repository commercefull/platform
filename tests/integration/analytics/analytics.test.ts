import axios, { AxiosInstance } from 'axios';
import {
  TEST_PRODUCT_1_ID,
  TEST_CUSTOMER_ID,
  ADMIN_CREDENTIALS
} from '../testConstants';

// Create axios client for tests
const createClient = () => axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Helper to get date range for tests
const getTestDateRange = (daysBack: number = 30) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

describe('Analytics Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdDashboardIds: string[] = [];

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    
    // Get admin token
    const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS);
    adminToken = loginResponse.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup dynamically created dashboards
    for (const dashboardId of createdDashboardIds) {
      try {
        await client.delete(`/business/analytics/dashboards/${dashboardId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      } catch (error) {
        console.warn(`Failed to cleanup dashboard ${dashboardId}`);
      }
    }
  });

  // ============================================================================
  // Sales Analytics Tests (UC-ANA-001, UC-ANA-002)
  // ============================================================================

  describe('Sales Analytics', () => {
    it('UC-ANA-001: should get sales dashboard', async () => {
      const { startDate, endDate } = getTestDateRange(30);
      
      const response = await client.get('/business/analytics/sales/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('summary');
      expect(response.data.data).toHaveProperty('daily');
      expect(response.data.data).toHaveProperty('realTime');
      
      // Verify summary structure
      const summary = response.data.data.summary;
      expect(summary).toHaveProperty('totalRevenue');
      expect(summary).toHaveProperty('totalOrders');
      expect(summary).toHaveProperty('averageOrderValue');
      expect(summary).toHaveProperty('newCustomers');
      expect(summary).toHaveProperty('conversionRate');
      
      // Verify realTime structure
      const realTime = response.data.data.realTime;
      expect(realTime).toHaveProperty('activeVisitors');
      expect(realTime).toHaveProperty('ordersLastHour');
      expect(realTime).toHaveProperty('revenueLastHour');
    });

    it('UC-ANA-002: should get daily sales data', async () => {
      const { startDate, endDate } = getTestDateRange(7);
      
      const response = await client.get('/business/analytics/sales/daily', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate, limit: 10 }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data).toHaveProperty('total');
      
      // If there's data, verify structure
      if (response.data.data.length > 0) {
        const day = response.data.data[0];
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('orderCount');
        expect(day).toHaveProperty('grossRevenue');
        expect(day).toHaveProperty('netRevenue');
      }
    });

    it('should filter sales data by channel', async () => {
      const { startDate, endDate } = getTestDateRange(30);
      
      const response = await client.get('/business/analytics/sales/daily', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate, channel: 'web' }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Product Analytics Tests (UC-ANA-003, UC-ANA-004)
  // ============================================================================

  describe('Product Analytics', () => {
    it('UC-ANA-003: should get product performance data', async () => {
      const { startDate, endDate } = getTestDateRange(30);
      
      const response = await client.get('/business/analytics/products', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate, limit: 10 }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // If there's data, verify structure
      if (response.data.data.length > 0) {
        const product = response.data.data[0];
        expect(product).toHaveProperty('productId');
        expect(product).toHaveProperty('views');
        expect(product).toHaveProperty('purchases');
        expect(product).toHaveProperty('revenue');
      }
    });

    it('UC-ANA-004: should get top products by revenue', async () => {
      const { startDate, endDate } = getTestDateRange(30);
      
      const response = await client.get('/business/analytics/products/top', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate, metric: 'revenue', limit: 5 }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get top products by views', async () => {
      const { startDate, endDate } = getTestDateRange(30);
      
      const response = await client.get('/business/analytics/products/top', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate, metric: 'views', limit: 5 }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Search Analytics Tests (UC-ANA-005, UC-ANA-006)
  // ============================================================================

  describe('Search Analytics', () => {
    it('UC-ANA-005: should get search analytics', async () => {
      const { startDate, endDate } = getTestDateRange(30);
      
      const response = await client.get('/business/analytics/search', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate, limit: 50 }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // If there's data, verify structure
      if (response.data.data.length > 0) {
        const search = response.data.data[0];
        expect(search).toHaveProperty('query');
        expect(search).toHaveProperty('searchCount');
        expect(search).toHaveProperty('isZeroResult');
      }
    });

    it('UC-ANA-006: should get zero result searches', async () => {
      const { startDate, endDate } = getTestDateRange(7);
      
      const response = await client.get('/business/analytics/search/zero-results', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // All results should be zero-result searches
      response.data.data.forEach((search: any) => {
        expect(search.isZeroResult).toBe(true);
      });
    });
  });

  // ============================================================================
  // Customer Analytics Tests (UC-ANA-007)
  // ============================================================================

  describe('Customer Analytics', () => {
    it('UC-ANA-007: should get customer cohorts', async () => {
      const response = await client.get('/business/analytics/customers/cohorts', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // If there's data, verify structure
      if (response.data.data.length > 0) {
        const cohort = response.data.data[0];
        expect(cohort).toHaveProperty('cohortMonth');
        expect(cohort).toHaveProperty('monthNumber');
        expect(cohort).toHaveProperty('customersInCohort');
        expect(cohort).toHaveProperty('retentionRate');
      }
    });
  });

  // ============================================================================
  // Event Tracking Tests (UC-ANA-008, UC-ANA-009)
  // ============================================================================

  describe('Event Tracking', () => {
    it('UC-ANA-008: should get events', async () => {
      const { startDate, endDate } = getTestDateRange(1);
      
      const response = await client.get('/business/analytics/events', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate, limit: 50 }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data).toHaveProperty('total');
    });

    it('should filter events by type', async () => {
      const { startDate, endDate } = getTestDateRange(1);
      
      const response = await client.get('/business/analytics/events', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate, eventType: 'order.created' }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-ANA-009: should get event counts', async () => {
      const { startDate, endDate } = getTestDateRange(1);
      
      const response = await client.get('/business/analytics/events/counts', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { startDate, endDate, groupBy: 'hour' }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  // ============================================================================
  // Snapshot Tests (UC-ANA-010, UC-ANA-011)
  // ============================================================================

  describe('Snapshots', () => {
    it('UC-ANA-010: should get snapshots', async () => {
      const { startDate, endDate } = getTestDateRange(30);
      
      const response = await client.get('/business/analytics/snapshots', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { snapshotType: 'daily', startDate, endDate }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-ANA-011: should get latest snapshot', async () => {
      const response = await client.get('/business/analytics/snapshots/latest', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { snapshotType: 'daily' }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // May be null if no snapshots exist
    });
  });

  // ============================================================================
  // Real-time Metrics Tests (UC-ANA-012)
  // ============================================================================

  describe('Real-time Metrics', () => {
    it('UC-ANA-012: should get real-time metrics', async () => {
      const response = await client.get('/business/analytics/realtime', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { minutes: 60 }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('activeVisitors');
      expect(response.data.data).toHaveProperty('ordersLastHour');
      expect(response.data.data).toHaveProperty('revenueLastHour');
      expect(response.data.data).toHaveProperty('cartsCreated');
      expect(response.data.data).toHaveProperty('checkoutsStarted');
    });
  });

  // ============================================================================
  // Dashboard Tests (UC-ANA-013 to UC-ANA-017)
  // ============================================================================

  describe('Dashboards', () => {
    let testDashboardId: string;

    it('UC-ANA-015: should create a dashboard', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        description: 'Integration test dashboard',
        dateRange: 'last_30_days',
        widgets: [
          { type: 'sales_summary', position: { x: 0, y: 0, w: 6, h: 4 } },
          { type: 'top_products', position: { x: 6, y: 0, w: 6, h: 4 } }
        ]
      };

      const response = await client.post('/business/analytics/dashboards', dashboardData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('analyticsReportDashboardId');
      expect(response.data.data).toHaveProperty('name', 'Test Dashboard');
      
      testDashboardId = response.data.data.analyticsReportDashboardId;
      createdDashboardIds.push(testDashboardId);
    });

    it('UC-ANA-013: should list dashboards', async () => {
      const response = await client.get('/business/analytics/dashboards', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-ANA-014: should get a dashboard by ID', async () => {
      if (!testDashboardId) {
        console.warn('Skipping: No test dashboard created');
        return;
      }

      const response = await client.get(`/business/analytics/dashboards/${testDashboardId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('analyticsReportDashboardId', testDashboardId);
      expect(response.data.data).toHaveProperty('name', 'Test Dashboard');
    });

    it('UC-ANA-016: should update a dashboard', async () => {
      if (!testDashboardId) {
        console.warn('Skipping: No test dashboard created');
        return;
      }

      const updateData = {
        name: 'Updated Test Dashboard',
        description: 'Updated description'
      };

      const response = await client.put(`/business/analytics/dashboards/${testDashboardId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', 'Updated Test Dashboard');
    });

    it('UC-ANA-017: should delete a dashboard', async () => {
      if (!testDashboardId) {
        console.warn('Skipping: No test dashboard created');
        return;
      }

      const response = await client.delete(`/business/analytics/dashboards/${testDashboardId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Remove from cleanup list since it's already deleted
      createdDashboardIds = createdDashboardIds.filter(id => id !== testDashboardId);
      
      // Verify it's deleted
      const getResponse = await client.get(`/business/analytics/dashboards/${testDashboardId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent dashboard', async () => {
      // Use a valid UUID format that doesn't exist
      const response = await client.get('/business/analytics/dashboards/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require authentication for analytics endpoints', async () => {
      const response = await client.get('/business/analytics/sales/dashboard');
      
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/analytics/sales/dashboard', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      
      expect(response.status).toBe(401);
    });
  });
});
