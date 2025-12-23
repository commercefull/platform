import express from 'express';
import {
  getMerchants,
  createMerchant,
  getMerchantById,
  updateMerchant,
  deleteMerchant,
  getMerchantAddresses,
  addMerchantAddress,
  updateMerchantAddress,
  getMerchantPaymentInfo,
  addMerchantPaymentInfo,
  updateMerchantPaymentInfo,
} from '../../controllers/merchantBusinessController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();

router.use(isMerchantLoggedIn);

// Admin routes for merchant management
router.get('/merchants', getMerchants);
router.post('/merchants', createMerchant);
router.get('/merchants/:id', getMerchantById);
router.put('/merchants/:id', updateMerchant);
router.delete('/merchants/:id', deleteMerchant);

// Admin routes for merchant addresses
router.get('/merchants/:merchantId/addresses', getMerchantAddresses);
router.post('/merchants/:merchantId/addresses', addMerchantAddress);
router.put('/merchants/:merchantId/addresses/:addressId', updateMerchantAddress);

// Admin routes for merchant payment information
router.get('/merchants/:merchantId/payment-info', getMerchantPaymentInfo);
router.post('/merchants/:merchantId/payment-info', addMerchantPaymentInfo);
router.put('/merchants/:merchantId/payment-info/:paymentInfoId', updateMerchantPaymentInfo);

export const merchantMerchantRouter = router;
