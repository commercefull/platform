import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  calculateTaxForBasket,
  calculateTaxForLineItem,
  checkCustomerTaxExemption,
  findTaxZoneForAddress,
  getCustomerTaxSettings,
  getTaxCategoryByCode,
  getTaxRates,
} from '../controllers/taxCustomerController';
import { isCustomerLoggedIn } from '../../../../libs/auth';

const router = Router();

// Public tax calculation endpoints
router.post('/tax/calculate', asyncHandler(calculateTaxForLineItem));

// Protected routes require authentication
router.post('/tax/calculate/basket/:basketId', isCustomerLoggedIn, asyncHandler(calculateTaxForBasket));

// Public tax information endpoints
router.get('/tax/rates', asyncHandler(getTaxRates));

router.get('/tax/categories/:code', asyncHandler(getTaxCategoryByCode));

// Customer exemption check (requires authentication)
router.get('/tax/exemption/:customerId', isCustomerLoggedIn, asyncHandler(checkCustomerTaxExemption));

// NEW: Tax zone finder endpoint
router.post('/tax/zones/find', asyncHandler(findTaxZoneForAddress));

// NEW: Get public tax settings for storefront
router.get('/tax/settings/:organizationId', asyncHandler(getCustomerTaxSettings));

export const taxCustomerRouter = router;
