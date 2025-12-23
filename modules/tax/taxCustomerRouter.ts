import { Router } from 'express';
import {
  calculateTaxForBasket,
  calculateTaxForLineItem,
  checkCustomerTaxExemption,
  findTaxZoneForAddress,
  getCustomerTaxSettings,
  getTaxCategoryByCode,
  getTaxRates,
} from './controllers/taxCustomerController';
import { isCustomerLoggedIn } from '../../libs/auth';

const router = Router();

// Public tax calculation endpoints
router.post('/tax/calculate', calculateTaxForLineItem);

// Protected routes require authentication
router.post('/tax/calculate/basket/:basketId', isCustomerLoggedIn, calculateTaxForBasket);

// Public tax information endpoints
router.get('/tax/rates', getTaxRates);

router.get('/tax/categories/:code', getTaxCategoryByCode);

// Customer exemption check (requires authentication)
router.get('/tax/exemption/:customerId', isCustomerLoggedIn, checkCustomerTaxExemption);

// NEW: Tax zone finder endpoint
router.post('/tax/zones/find', findTaxZoneForAddress);

// NEW: Get public tax settings for storefront
router.get('/tax/settings/:merchantId', getCustomerTaxSettings);

export const taxCustomerRouter = router;
