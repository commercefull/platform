/**
 * B2B Price List Router
 * Routes for B2B price list operations
 */

import { Router } from 'express';
import { isB2BLoggedIn } from '../../../../libs/auth';
import { listPriceLists, getPriceList, createPriceList, updatePriceList } from '../controllers/b2bPriceListController';

const router = Router();

router.use(isB2BLoggedIn);

router.get('/b2b/price-lists', listPriceLists);
router.post('/b2b/price-lists', createPriceList);
router.get('/b2b/price-lists/:priceListId', getPriceList);
router.put('/b2b/price-lists/:priceListId', updatePriceList);

export const b2bPriceListRouter = router;
