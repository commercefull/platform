import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../libs/asyncHandler';
import { isAdminLoggedIn } from '../../libs/auth';
import {
  getAdminDashboard,
  getAdminLogin,
  getAdminProfile,
  postAdminLogin,
  postAdminLogout,
} from '../../modules/identity';
import { registerCatalogRoutes } from './routes/catalog';
import { registerCommerceRoutes } from './routes/commerce';
import { registerOperationsRoutes } from './routes/operations';
import { registerMarketingRoutes } from './routes/marketing';
import { registerProgramsRoutes } from './routes/programs';
import { registerSystemRoutes } from './routes/system';

const router = createHttpRouter();

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

// GET: admin login page
router.get('/login', asyncHandler(getAdminLogin));

// POST: admin login form submission
router.post('/login', asyncHandler(postAdminLogin));

// POST: admin logout
router.post('/logout', asyncHandler(postAdminLogout));

// ============================================================================
// Protected Routes (admin auth required)
// ============================================================================

// Apply authentication middleware to all routes below
router.use(isAdminLoggedIn);

// GET: admin dashboard (home)
router.get('/', asyncHandler(getAdminDashboard));

// GET: admin profile
router.get('/profile', asyncHandler(getAdminProfile));

// Route groups (see web/admin/routes/)
registerCatalogRoutes(router);
registerCommerceRoutes(router);
registerOperationsRoutes(router);
registerProgramsRoutes(router);
registerMarketingRoutes(router);
registerSystemRoutes(router);

export const adminRouter = router;
