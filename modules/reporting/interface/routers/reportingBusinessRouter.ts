/**
 * Reporting Business Router
 */

import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import * as reportingController from '../controllers/ReportingController';

const router = express.Router();

router.use(isOrganizationLoggedIn);

// Report generation (on-demand)
router.post('/reports/generate', asyncHandler(reportingController.generateReport));

// Report templates
router.get('/reports/templates', asyncHandler(reportingController.getReportTemplates));

// Report schedule CRUD
router.get('/reports/schedules', asyncHandler(reportingController.listSchedules));
router.post('/reports/schedules', asyncHandler(reportingController.createSchedule));
router.get('/reports/schedules/:scheduleId', asyncHandler(reportingController.getSchedule));
router.put('/reports/schedules/:scheduleId', asyncHandler(reportingController.updateSchedule));
router.delete('/reports/schedules/:scheduleId', asyncHandler(reportingController.deleteSchedule));

// Report executions (history)
router.get('/reports/schedules/:scheduleId/executions', asyncHandler(reportingController.listExecutions));

export const reportingBusinessRouter = router;
