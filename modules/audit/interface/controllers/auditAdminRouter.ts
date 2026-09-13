/**
 * Audit Admin Router
 *
 * Read-only audit log endpoints for admin/organization users.
 * Mounted at /business, routes prefixed with /audit.
 */

import { Router } from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { AuditAdminController } from './auditAdminController';

const router = Router();
const controller = new AuditAdminController();

router.use(isOrganizationLoggedIn);

router.get('/audit', controller.listLogs);
router.get('/audit/stats', controller.getStats);
router.get('/audit/verify', controller.verifyChain);
router.get('/audit/correlation/:correlationId', controller.findByCorrelationId);
router.get('/audit/:id', controller.getLog);

export const auditAdminRouter = router;
