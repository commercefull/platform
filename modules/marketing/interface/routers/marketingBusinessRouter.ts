import express from 'express';
import { isMerchantLoggedIn } from '../../../../libs/auth';
import * as controller from '../controllers/marketingBusinessController';

const router = express.Router();

router.use(isMerchantLoggedIn);

router.get('/marketing/campaigns', controller.listCampaigns);
router.post('/marketing/campaigns', controller.createCampaign);
router.post('/marketing/campaigns/:campaignId/send', controller.sendCampaign);
router.get('/marketing/affiliates', controller.listAffiliates);
router.post('/marketing/affiliates', controller.createAffiliate);
router.get('/marketing/affiliates/:affiliateId', controller.getAffiliate);
router.get('/marketing/referrals', controller.listReferrals);

export const marketingBusinessRouter = router;
