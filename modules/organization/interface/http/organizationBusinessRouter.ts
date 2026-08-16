import express from 'express';
import {
  getOrganizations,
  createOrganization,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getOrganizationStores,
  getOrganizationAddresses,
  addOrganizationAddress,
  updateOrganizationAddress,
  getOrganizationPaymentInfo,
  addOrganizationPaymentInfo,
  updateOrganizationPaymentInfo,
} from '../controllers/organizationBusinessController';
import { isMerchantLoggedIn } from '../../../../libs/auth';

const router = express.Router();

router.use(isMerchantLoggedIn);

router.get('/organizations', getOrganizations);
router.post('/organizations', createOrganization);
router.get('/organizations/:id', getOrganizationById);
router.put('/organizations/:id', updateOrganization);
router.delete('/organizations/:id', deleteOrganization);
router.get('/organizations/:id/stores', getOrganizationStores);

router.get('/organizations/:organizationId/addresses', getOrganizationAddresses);
router.post('/organizations/:organizationId/addresses', addOrganizationAddress);
router.put('/organizations/:organizationId/addresses/:addressId', updateOrganizationAddress);

router.get('/organizations/:organizationId/payment-info', getOrganizationPaymentInfo);
router.post('/organizations/:organizationId/payment-info', addOrganizationPaymentInfo);
router.put('/organizations/:organizationId/payment-info/:paymentInfoId', updateOrganizationPaymentInfo);

export const organizationBusinessRouter = router;
