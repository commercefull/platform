/**
 * B2B Merchant (Business) Router
 * Merchant-facing routes for B2B credit and price list management
 */

import { Router } from 'express';
import { isMerchantLoggedIn } from '../../../../libs/auth';
import { getCreditStatus, listTransactions, recordTransaction } from '../controllers/b2bCreditController';
import { listPriceLists, getPriceList, createPriceList, updatePriceList } from '../controllers/b2bPriceListController';

const router = Router();

router.use(isMerchantLoggedIn);

// ============================================================================
// Company Credit Routes (merchant view)
// ============================================================================

router.get('/b2b/companies/:companyId/credit', getCreditStatus);
router.get('/b2b/companies/:companyId/credit/transactions', listTransactions);
router.post('/b2b/companies/:companyId/credit/transactions', recordTransaction);

// ============================================================================
// Price List Routes (merchant view)
// ============================================================================

router.get('/b2b/price-lists', listPriceLists);
router.post('/b2b/price-lists', createPriceList);
router.get('/b2b/price-lists/:priceListId', getPriceList);
router.put('/b2b/price-lists/:priceListId', updatePriceList);

export const b2bMerchantRouter = router;
