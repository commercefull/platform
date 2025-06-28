import { Router } from 'express';
import { calculateTaxForBasket, calculateTaxForLineItem, checkCustomerTaxExemption, findTaxZoneForAddress, getStorefrontTaxSettings, getTaxCategoryByCode, getTaxRates } from './controllers/taxStorefrontController';
import { isCustomerLoggedIn } from '../../libs/auth';

const router = Router();

// Public tax calculation endpoints
router.post('/calculate', calculateTaxForLineItem);

// Protected routes require authentication
router.post('/calculate/basket/:basketId', isCustomerLoggedIn, calculateTaxForBasket);

// Public tax information endpoints
router.get('/rates', getTaxRates);

router.get('/categories/:code', getTaxCategoryByCode);

// Customer exemption check (requires authentication)
router.get('/exemption/:customerId', isCustomerLoggedIn, checkCustomerTaxExemption);

// NEW: Tax zone finder endpoint
router.post('/zones/find', findTaxZoneForAddress);

// NEW: Get public tax settings for storefront
router.get('/settings/:merchantId', getStorefrontTaxSettings);

export const taxStorefrontRouter = router;
