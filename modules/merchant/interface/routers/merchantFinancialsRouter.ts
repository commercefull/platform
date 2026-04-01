/**
 * Merchant Financials Router
 * Routes under /business/merchant/financials
 */

import express from 'express';
import { isMerchantLoggedIn } from '../../../../libs/auth';
import * as merchantFinancialsController from '../controllers/merchantFinancialsController';

const router = express.Router();

router.use(isMerchantLoggedIn);

router.get('/merchant/financials', merchantFinancialsController.getFinancials);
router.get('/merchant/financials/balance', merchantFinancialsController.getBalance);
router.get('/merchant/financials/payouts', merchantFinancialsController.listPayouts);
router.post('/merchant/financials/payouts', merchantFinancialsController.createPayout);
router.get('/merchant/financials/invoices', merchantFinancialsController.listInvoices);
router.get('/merchant/financials/settlements/:payoutId', merchantFinancialsController.getSettlement);

export const merchantFinancialsRouter = router;
