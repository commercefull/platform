import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import segmentController from '../controllers/segmentController';

export const segmentBusinessRouter = createHttpRouter();

// Segment CRUD
segmentBusinessRouter.get('/segment', isOrganizationLoggedIn, asyncHandler(segmentController.listSegments));

// Customer profiles (must be before /segment/:segmentId to avoid param matching)
segmentBusinessRouter.get('/segment/profiles', isOrganizationLoggedIn, asyncHandler(segmentController.listCustomerProfiles));
segmentBusinessRouter.get('/segment/profiles/:customerId', isOrganizationLoggedIn, asyncHandler(segmentController.getCustomerProfile));
segmentBusinessRouter.post('/segment/profiles/:customerId/compute', isOrganizationLoggedIn, asyncHandler(segmentController.computeProfile));
segmentBusinessRouter.post('/segment/profiles/recompute-all', isOrganizationLoggedIn, asyncHandler(segmentController.recomputeAll));
segmentBusinessRouter.get(
  '/segment/profiles/:customerId/segments',
  isOrganizationLoggedIn,
  asyncHandler(segmentController.getCustomerSegments),
);

segmentBusinessRouter.get('/segment/:segmentId', isOrganizationLoggedIn, asyncHandler(segmentController.getSegment));
segmentBusinessRouter.post('/segment', isOrganizationLoggedIn, asyncHandler(segmentController.createSegment));
segmentBusinessRouter.put('/segment/:segmentId', isOrganizationLoggedIn, asyncHandler(segmentController.updateSegment));
segmentBusinessRouter.delete('/segment/:segmentId', isOrganizationLoggedIn, asyncHandler(segmentController.deleteSegment));

// Segment evaluation & members
segmentBusinessRouter.post('/segment/:segmentId/evaluate', isOrganizationLoggedIn, asyncHandler(segmentController.evaluateSegment));
segmentBusinessRouter.get('/segment/:segmentId/members', isOrganizationLoggedIn, asyncHandler(segmentController.getSegmentMembers));
