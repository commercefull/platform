import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import automationController from '../controllers/automationController';

export const automationBusinessRouter = createHttpRouter();

// Rule CRUD
automationBusinessRouter.get('/automation', isOrganizationLoggedIn, asyncHandler(automationController.listRules));
automationBusinessRouter.get('/automation/:ruleId', isOrganizationLoggedIn, asyncHandler(automationController.getRule));
automationBusinessRouter.post('/automation', isOrganizationLoggedIn, asyncHandler(automationController.createRule));
automationBusinessRouter.put('/automation/:ruleId', isOrganizationLoggedIn, asyncHandler(automationController.updateRule));
automationBusinessRouter.delete('/automation/:ruleId', isOrganizationLoggedIn, asyncHandler(automationController.deleteRule));

// Manual trigger & execution logs
automationBusinessRouter.post('/automation/:ruleId/trigger', isOrganizationLoggedIn, asyncHandler(automationController.triggerRule));
automationBusinessRouter.get('/automation/:ruleId/logs', isOrganizationLoggedIn, asyncHandler(automationController.getExecutionLogs));
