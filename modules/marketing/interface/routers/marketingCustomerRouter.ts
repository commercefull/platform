import express from 'express';
import { isCustomerLoggedIn } from '../../../../libs/auth';
import * as controller from '../controllers/marketingCustomerController';

const router = express.Router();

router.use(isCustomerLoggedIn);

router.get('/referrals', controller.getReferralStatus);

export const marketingCustomerRouter = router;
