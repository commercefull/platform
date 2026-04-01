/**
 * B2B Credit Router
 * Routes for B2B company credit operations
 */

import { Router } from 'express';
import { isB2BLoggedIn } from '../../../../libs/auth';
import { getCreditStatus, listTransactions, recordTransaction } from '../controllers/b2bCreditController';

const router = Router();

router.use(isB2BLoggedIn);

router.get('/b2b/credit', getCreditStatus);
router.get('/b2b/credit/transactions', listTransactions);
router.post('/b2b/credit/transactions', recordTransaction);

export const b2bCreditRouter = router;
