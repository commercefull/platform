/**
 * Audit Admin Router
 *
 * Read-only audit log endpoints for admin/organization users.
 * Mounted at /business/audit
 */

import { Router } from 'express';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { AuditAdminController } from './auditAdminController';

const router = Router();
const controller = new AuditAdminController();

router.use(isOrganizationLoggedIn);

router.get('/', controller.listLogs);
router.get('/stats', controller.getStats);
router.get('/verify', controller.verifyChain);
router.get('/correlation/:correlationId', controller.findByCorrelationId);
router.get('/:id', controller.getLog);

export const auditAdminRouter = router;
