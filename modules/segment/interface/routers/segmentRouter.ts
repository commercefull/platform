import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import segmentController from '../controllers/segmentController';

export const segmentBusinessRouter = express.Router();

// Segment CRUD
segmentBusinessRouter.get('/segment', isOrganizationLoggedIn, asyncHandler(segmentController.listSegments.bind(segmentController)));
segmentBusinessRouter.get('/segment/:segmentId', isOrganizationLoggedIn, asyncHandler(segmentController.getSegment.bind(segmentController)));
segmentBusinessRouter.post('/segment', isOrganizationLoggedIn, asyncHandler(segmentController.createSegment.bind(segmentController)));
segmentBusinessRouter.put('/segment/:segmentId', isOrganizationLoggedIn, asyncHandler(segmentController.updateSegment.bind(segmentController)));
segmentBusinessRouter.delete('/segment/:segmentId', isOrganizationLoggedIn, asyncHandler(segmentController.deleteSegment.bind(segmentController)));

// Segment evaluation & members
segmentBusinessRouter.post('/segment/:segmentId/evaluate', isOrganizationLoggedIn, asyncHandler(segmentController.evaluateSegment.bind(segmentController)));
segmentBusinessRouter.get('/segment/:segmentId/members', isOrganizationLoggedIn, asyncHandler(segmentController.getSegmentMembers.bind(segmentController)));

// Customer profiles
segmentBusinessRouter.get('/segment/profiles', isOrganizationLoggedIn, asyncHandler(segmentController.listCustomerProfiles.bind(segmentController)));
segmentBusinessRouter.get('/segment/profiles/:customerId', isOrganizationLoggedIn, asyncHandler(segmentController.getCustomerProfile.bind(segmentController)));
segmentBusinessRouter.post('/segment/profiles/:customerId/compute', isOrganizationLoggedIn, asyncHandler(segmentController.computeProfile.bind(segmentController)));
segmentBusinessRouter.post('/segment/profiles/recompute-all', isOrganizationLoggedIn, asyncHandler(segmentController.recomputeAll.bind(segmentController)));

// Customer segment membership
segmentBusinessRouter.get('/segment/profiles/:customerId/segments', isOrganizationLoggedIn, asyncHandler(segmentController.getCustomerSegments.bind(segmentController)));
