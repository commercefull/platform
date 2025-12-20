/**
 * Business HTTP Router
 * Defines routes for business operations
 */

import { Router } from 'express';
import { BusinessController } from './BusinessController';

const router = Router();
const businessController = new BusinessController();

// Create business
router.post('/businesses', businessController.createBusiness.bind(businessController));

// Get business by ID
router.get('/businesses/:businessId', businessController.getBusiness.bind(businessController));

// Get business by slug
router.get('/businesses/slug/:slug', businessController.getBusinessBySlug.bind(businessController));

// List all businesses
router.get('/businesses', businessController.listBusinesses.bind(businessController));

export { router as businessRouter };
