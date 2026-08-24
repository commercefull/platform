import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import {
  getAllTaxRates,
  getTaxRate,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getAllTaxCategories,
  getTaxCategory,
  createTaxCategory,
  updateTaxCategory,
  deleteTaxCategory,
  getAllTaxZones,
  getTaxZoneById,
  createTaxZone,
  updateTaxZone,
  deleteTaxZone,
} from '../controllers/taxBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = Router();

router.use(isOrganizationLoggedIn);

// -------------------- Tax Rate Routes --------------------
router.get('/tax/rates', asyncHandler(getAllTaxRates));
router.get('/tax/rates/:id', asyncHandler(getTaxRate));
router.post('/tax/rates', asyncHandler(createTaxRate));
router.put('/tax/rates/:id', asyncHandler(updateTaxRate));
router.delete('/tax/rates/:id', asyncHandler(deleteTaxRate));

// -------------------- Tax Category Routes --------------------
router.get('/tax/categories', asyncHandler(getAllTaxCategories));
router.get('/tax/categories/:id', asyncHandler(getTaxCategory));
router.post('/tax/categories', asyncHandler(createTaxCategory));
router.put('/tax/categories/:id', asyncHandler(updateTaxCategory));
router.delete('/tax/categories/:id', asyncHandler(deleteTaxCategory));

// -------------------- Tax Zone Routes --------------------
router.get('/tax/zones', asyncHandler(getAllTaxZones));
router.get('/tax/zones/:id', asyncHandler(getTaxZoneById));
router.post('/tax/zones', asyncHandler(createTaxZone));
router.put('/tax/zones/:id', asyncHandler(updateTaxZone));
router.delete('/tax/zones/:id', asyncHandler(deleteTaxZone));

export const taxBusinessRouter = router;
