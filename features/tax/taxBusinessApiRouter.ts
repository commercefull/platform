import { Router } from 'express';
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
  getTaxZoneById,
  createTaxZone,
  updateTaxZone,
  deleteTaxZone
} from './controllers/taxBusinessApiController';
import { isAdmin } from '../../libs/auth';

const router = Router();

// -------------------- Tax Rate Routes --------------------
router.get('/rates', isAdmin, getAllTaxRates);
router.get('/rates/:id', isAdmin, getTaxRate);
router.post('/rates', isAdmin, createTaxRate);
router.put('/rates/:id', isAdmin, updateTaxRate);
router.delete('/rates/:id', isAdmin, deleteTaxRate);

// -------------------- Tax Category Routes --------------------
router.get('/categories', isAdmin, getAllTaxCategories);
router.get('/categories/:id', isAdmin, getTaxCategory);
router.post('/categories', isAdmin, createTaxCategory);
router.put('/categories/:id', isAdmin, updateTaxCategory);
router.delete('/categories/:id', isAdmin, deleteTaxCategory);

// -------------------- Tax Zone Routes --------------------
router.get('/zones/:id', isAdmin, getTaxZoneById);
router.post('/zones', isAdmin, createTaxZone);
router.put('/zones/:id', isAdmin, updateTaxZone);
router.delete('/zones/:id', isAdmin, deleteTaxZone);

export const taxBusinessApiRouter = router;
