/**
 * Reporting Business Router
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  createSchedule,
  deleteSchedule,
  generateReport,
  getReportTemplates,
  getSchedule,
  listExecutions,
  listSchedules,
  updateSchedule,
} from '../controllers/ReportingController';
const router = createHttpRouter();

router.use(isOrganizationLoggedIn);

// Report generation (on-demand)
router.post('/reports/generate', asyncHandler(generateReport));

// Report templates
router.get('/reports/templates', asyncHandler(getReportTemplates));

// Report schedule CRUD
router.get('/reports/schedules', asyncHandler(listSchedules));
router.post('/reports/schedules', asyncHandler(createSchedule));
router.get('/reports/schedules/:scheduleId', asyncHandler(getSchedule));
router.put('/reports/schedules/:scheduleId', asyncHandler(updateSchedule));
router.delete('/reports/schedules/:scheduleId', asyncHandler(deleteSchedule));

// Report executions (history)
router.get('/reports/schedules/:scheduleId/executions', asyncHandler(listExecutions));

export const reportingBusinessRouter = router;
