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
} from './controllers/taxMerchantController';
import { isMerchantLoggedIn } from '../../libs/auth';

const router = Router();

router.use(isMerchantLoggedIn);

// -------------------- Tax Rate Routes --------------------
router.get('/tax/rates', getAllTaxRates);
router.get('/tax/rates/:id', getTaxRate);
router.post('/tax/rates', createTaxRate);
router.put('/tax/rates/:id', updateTaxRate);
router.delete('/tax/rates/:id', deleteTaxRate);

// -------------------- Tax Category Routes --------------------
router.get('/tax/categories', getAllTaxCategories);
router.get('/tax/categories/:id', getTaxCategory);
router.post('/tax/categories', createTaxCategory);
router.put('/tax/categories/:id', updateTaxCategory);
router.delete('/tax/categories/:id', deleteTaxCategory);

// -------------------- Tax Zone Routes --------------------
router.get('/tax/zones/:id', getTaxZoneById);
router.post('/tax/zones', createTaxZone);
router.put('/tax/zones/:id', updateTaxZone);
router.delete('/tax/zones/:id', deleteTaxZone);

export const taxBusinessRouter = router;
