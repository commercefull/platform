/**
 * Reporting Business Router
 */

import express from 'express';
import { isMerchantLoggedIn } from '../../../../libs/auth';
import * as reportingController from '../controllers/ReportingController';

const router = express.Router();

router.use(isMerchantLoggedIn);

// Report generation (on-demand)
router.post('/reports/generate', reportingController.generateReport);

// Report templates
router.get('/reports/templates', reportingController.getReportTemplates);

// Report schedule CRUD
router.get('/reports/schedules', reportingController.listSchedules);
router.post('/reports/schedules', reportingController.createSchedule);
router.get('/reports/schedules/:scheduleId', reportingController.getSchedule);
router.put('/reports/schedules/:scheduleId', reportingController.updateSchedule);
router.delete('/reports/schedules/:scheduleId', reportingController.deleteSchedule);

// Report executions (history)
router.get('/reports/schedules/:scheduleId/executions', reportingController.listExecutions);

export const reportingBusinessRouter = router;
