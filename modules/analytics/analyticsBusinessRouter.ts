/**
 * Analytics Business Router
 * Admin/merchant routes for analytics and reporting
 */

import express from 'express';
import * as analyticsController from './controllers/analyticsBusinessController';
import { isMerchantLoggedIn } from '../../libs/auth';

const router = express.Router();

router.use(isMerchantLoggedIn);

// ============================================================================
// Sales Analytics
// ============================================================================

// GET /business/analytics/sales/dashboard - Get sales dashboard with summary
router.get('/analytics/sales/dashboard', analyticsController.getSalesDashboard);

// GET /business/analytics/sales/daily - Get daily sales data
router.get('/analytics/sales/daily', analyticsController.getSalesDaily);

// ============================================================================
// Product Analytics
// ============================================================================

// GET /business/analytics/products - Get product performance data
router.get('/analytics/products', analyticsController.getProductPerformance);

// GET /business/analytics/products/top - Get top performing products
router.get('/analytics/products/top', analyticsController.getTopProducts);

// ============================================================================
// Search Analytics
// ============================================================================

// GET /business/analytics/search - Get search analytics
router.get('/analytics/search', analyticsController.getSearchAnalytics);

// GET /business/analytics/search/zero-results - Get zero result searches
router.get('/analytics/search/zero-results', analyticsController.getZeroResultSearches);

// ============================================================================
// Customer Analytics
// ============================================================================

// GET /business/analytics/customers/cohorts - Get customer cohort analysis
router.get('/analytics/customers/cohorts', analyticsController.getCustomerCohorts);

// ============================================================================
// Event Tracking
// ============================================================================

// GET /business/analytics/events - Get tracked events
router.get('/analytics/events', analyticsController.getEvents);

// GET /business/analytics/events/counts - Get event counts by period
router.get('/analytics/events/counts', analyticsController.getEventCounts);

// ============================================================================
// Snapshots
// ============================================================================

// GET /business/analytics/snapshots - Get historical snapshots
router.get('/analytics/snapshots', analyticsController.getSnapshots);

// GET /business/analytics/snapshots/latest - Get latest snapshot
router.get('/analytics/snapshots/latest', analyticsController.getLatestSnapshot);

// ============================================================================
// Real-time
// ============================================================================

// GET /business/analytics/realtime - Get real-time metrics
router.get('/analytics/realtime', analyticsController.getRealTimeMetrics);

// ============================================================================
// Dashboards
// ============================================================================

// GET /business/analytics/dashboards - List dashboards
router.get('/analytics/dashboards', analyticsController.getDashboards);

// GET /business/analytics/dashboards/:id - Get dashboard
router.get('/analytics/dashboards/:id', analyticsController.getDashboard);

// POST /business/analytics/dashboards - Create dashboard
router.post('/analytics/dashboards', analyticsController.createDashboard);

// PUT /business/analytics/dashboards/:id - Update dashboard
router.put('/analytics/dashboards/:id', analyticsController.updateDashboard);

// DELETE /business/analytics/dashboards/:id - Delete dashboard
router.delete('/analytics/dashboards/:id', analyticsController.deleteDashboard);

export const analyticsBusinessRouter = router;
