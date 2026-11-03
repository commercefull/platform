import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { migrationController } from '../controllers/migrationController';

const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

// Import job CRUD
router.post('/jobs', asyncHandler(migrationController.createJob));
router.get('/jobs', asyncHandler(migrationController.listJobs));
router.get('/jobs/:importJobId', asyncHandler(migrationController.getJob));
router.post('/jobs/:importJobId/start', asyncHandler(migrationController.startJob));
router.post('/jobs/:importJobId/complete', asyncHandler(migrationController.completeJob));
router.post('/jobs/:importJobId/fail', asyncHandler(migrationController.failJob));
router.post('/jobs/:importJobId/pause', asyncHandler(migrationController.pauseJob));
router.post('/jobs/:importJobId/cancel', asyncHandler(migrationController.cancelJob));
router.delete('/jobs/:importJobId', asyncHandler(migrationController.deleteJob));

// Import mappings
router.get('/jobs/:importJobId/mappings', asyncHandler(migrationController.getMappings));
router.post('/jobs/:importJobId/mappings', asyncHandler(migrationController.createMapping));
router.get('/jobs/:importJobId/mappings/lookup', asyncHandler(migrationController.lookupMapping));

// Import errors
router.get('/jobs/:importJobId/errors', asyncHandler(migrationController.getErrors));
router.post('/errors/:importErrorId/resolve', asyncHandler(migrationController.resolveError));

export { router as migrationBusinessRouter };
