/**
 * Organization Router
 */

import { Router } from 'express';
import { isMerchantLoggedIn } from '../../../../libs/auth';
import {
  createOrganization,
  updateOrganization,
  getOrganization,
  getOrganizationBySlug,
  listOrganizations,
  getOrganizationStores,
} from '../controllers/OrganizationController';

const router = Router();

router.use(isMerchantLoggedIn);

// List all organizations
router.get('/organization', listOrganizations);

// Create organization
router.post('/organization', createOrganization);

// Get organization by ID
router.get('/organization/:organizationId', getOrganization);

// Get organization by slug
router.get('/organization/slug/:slug', getOrganizationBySlug);

// Update organization
router.put('/organization/:organizationId', updateOrganization);
router.patch('/organization/:organizationId', updateOrganization);

// Get stores for organization
router.get('/organization/:organizationId/stores', getOrganizationStores);

export const organizationBusinessRouter = router;
export default router;
