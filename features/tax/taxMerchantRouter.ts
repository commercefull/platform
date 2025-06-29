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
router.get('/rates', getAllTaxRates);
router.get('/rates/:id', getTaxRate);
router.post('/rates', createTaxRate);
router.put('/rates/:id', updateTaxRate);
router.delete('/rates/:id', deleteTaxRate);

// -------------------- Tax Category Routes --------------------
router.get('/categories', getAllTaxCategories);
router.get('/categories/:id', getTaxCategory);
router.post('/categories', createTaxCategory);
router.put('/categories/:id', updateTaxCategory);
router.delete('/categories/:id', deleteTaxCategory);

// -------------------- Tax Zone Routes --------------------
router.get('/zones/:id', getTaxZoneById);
router.post('/zones', createTaxZone);
router.put('/zones/:id', updateTaxZone);
router.delete('/zones/:id', deleteTaxZone);

export const taxMerchantRouter = router;
