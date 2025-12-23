/**
 * Organization Router
 */

import { Router } from 'express';
import {
  createOrganization,
  updateOrganization,
  getOrganization,
  getOrganizationBySlug,
  listOrganizations,
  getOrganizationStores,
} from '../controllers/OrganizationController';

const router = Router();

// List all organizations
router.get('/', listOrganizations);

// Create organization
router.post('/', createOrganization);

// Get organization by ID
router.get('/:organizationId', getOrganization);

// Get organization by slug
router.get('/slug/:slug', getOrganizationBySlug);

// Update organization
router.put('/:organizationId', updateOrganization);
router.patch('/:organizationId', updateOrganization);

// Get stores for organization
router.get('/:organizationId/stores', getOrganizationStores);

export const organizationBusinessRouter = router;
export default router;
