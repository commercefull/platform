import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { migrationController } from '../controllers/migrationController';

const router = Router();

router.use(isOrganizationLoggedIn);

// Import job CRUD
router.post('/jobs', asyncHandler(migrationController.createJob.bind(migrationController)));
router.get('/jobs', asyncHandler(migrationController.listJobs.bind(migrationController)));
router.get('/jobs/:importJobId', asyncHandler(migrationController.getJob.bind(migrationController)));
router.post('/jobs/:importJobId/start', asyncHandler(migrationController.startJob.bind(migrationController)));
router.post('/jobs/:importJobId/complete', asyncHandler(migrationController.completeJob.bind(migrationController)));
router.post('/jobs/:importJobId/fail', asyncHandler(migrationController.failJob.bind(migrationController)));
router.post('/jobs/:importJobId/pause', asyncHandler(migrationController.pauseJob.bind(migrationController)));
router.post('/jobs/:importJobId/cancel', asyncHandler(migrationController.cancelJob.bind(migrationController)));
router.delete('/jobs/:importJobId', asyncHandler(migrationController.deleteJob.bind(migrationController)));

// Import mappings
router.get('/jobs/:importJobId/mappings', asyncHandler(migrationController.getMappings.bind(migrationController)));
router.post('/jobs/:importJobId/mappings', asyncHandler(migrationController.createMapping.bind(migrationController)));
router.get('/jobs/:importJobId/mappings/lookup', asyncHandler(migrationController.lookupMapping.bind(migrationController)));

// Import errors
router.get('/jobs/:importJobId/errors', asyncHandler(migrationController.getErrors.bind(migrationController)));
router.post('/errors/:importErrorId/resolve', asyncHandler(migrationController.resolveError.bind(migrationController)));

export { router as migrationBusinessRouter };
