/**
 * Analytics Business Router
 * Admin/merchant routes for analytics and reporting
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  createDashboard,
  deleteDashboard,
  getCustomerCohorts,
  getDashboard,
  getDashboards,
  getEventCounts,
  getEvents,
  getLatestSnapshot,
  getProductPerformance,
  getRealTimeMetrics,
  getSalesDaily,
  getSalesDashboard,
  getSearchAnalytics,
  getSnapshots,
  getTopProducts,
  getZeroResultSearches,
  updateDashboard,
} from '../controllers/analyticsBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

// ============================================================================
// Sales Analytics
// ============================================================================

// GET /business/analytics/sales/dashboard - Get sales dashboard with summary
router.get('/analytics/sales/dashboard', asyncHandler(getSalesDashboard));

// GET /business/analytics/sales/daily - Get daily sales data
router.get('/analytics/sales/daily', asyncHandler(getSalesDaily));

// ============================================================================
// Product Analytics
// ============================================================================

// GET /business/analytics/products - Get product performance data
router.get('/analytics/products', asyncHandler(getProductPerformance));

// GET /business/analytics/products/top - Get top performing products
router.get('/analytics/products/top', asyncHandler(getTopProducts));

// ============================================================================
// Search Analytics
// ============================================================================

// GET /business/analytics/search - Get search analytics
router.get('/analytics/search', asyncHandler(getSearchAnalytics));

// GET /business/analytics/search/zero-results - Get zero result searches
router.get('/analytics/search/zero-results', asyncHandler(getZeroResultSearches));

// ============================================================================
// Customer Analytics
// ============================================================================

// GET /business/analytics/customers/cohorts - Get customer cohort analysis
router.get('/analytics/customers/cohorts', asyncHandler(getCustomerCohorts));

// ============================================================================
// Event Tracking
// ============================================================================

// GET /business/analytics/events - Get tracked events
router.get('/analytics/events', asyncHandler(getEvents));

// GET /business/analytics/events/counts - Get event counts by period
router.get('/analytics/events/counts', asyncHandler(getEventCounts));

// ============================================================================
// Snapshots
// ============================================================================

// GET /business/analytics/snapshots - Get historical snapshots
router.get('/analytics/snapshots', asyncHandler(getSnapshots));

// GET /business/analytics/snapshots/latest - Get latest snapshot
router.get('/analytics/snapshots/latest', asyncHandler(getLatestSnapshot));

// ============================================================================
// Real-time
// ============================================================================

// GET /business/analytics/realtime - Get real-time metrics
router.get('/analytics/realtime', asyncHandler(getRealTimeMetrics));

// ============================================================================
// Dashboards
// ============================================================================

// GET /business/analytics/dashboards - List dashboards
router.get('/analytics/dashboards', asyncHandler(getDashboards));

// GET /business/analytics/dashboards/:id - Get dashboard
router.get('/analytics/dashboards/:id', asyncHandler(getDashboard));

// POST /business/analytics/dashboards - Create dashboard
router.post('/analytics/dashboards', asyncHandler(createDashboard));

// PUT /business/analytics/dashboards/:id - Update dashboard
router.put('/analytics/dashboards/:id', asyncHandler(updateDashboard));

// DELETE /business/analytics/dashboards/:id - Delete dashboard
router.delete('/analytics/dashboards/:id', asyncHandler(deleteDashboard));

export const analyticsBusinessRouter = router;
