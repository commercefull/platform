import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
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
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

router.use(isOrganizationLoggedIn);

router.get('/organizations', asyncHandler(getOrganizations));
router.post('/organizations', asyncHandler(createOrganization));
router.get('/organizations/:id', asyncHandler(getOrganizationById));
router.put('/organizations/:id', asyncHandler(updateOrganization));
router.delete('/organizations/:id', asyncHandler(deleteOrganization));
router.get('/organizations/:id/stores', asyncHandler(getOrganizationStores));

router.get('/organizations/:organizationId/addresses', asyncHandler(getOrganizationAddresses));
router.post('/organizations/:organizationId/addresses', asyncHandler(addOrganizationAddress));
router.put('/organizations/:organizationId/addresses/:addressId', asyncHandler(updateOrganizationAddress));

router.get('/organizations/:organizationId/payment-info', asyncHandler(getOrganizationPaymentInfo));
router.post('/organizations/:organizationId/payment-info', asyncHandler(addOrganizationPaymentInfo));
router.put('/organizations/:organizationId/payment-info/:paymentInfoId', asyncHandler(updateOrganizationPaymentInfo));

export const organizationBusinessRouter = router;
