import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import automationController from '../controllers/automationController';

export const automationBusinessRouter = express.Router();

// Rule CRUD
automationBusinessRouter.get('/automation', isOrganizationLoggedIn, asyncHandler(automationController.listRules.bind(automationController)));
automationBusinessRouter.get('/automation/:ruleId', isOrganizationLoggedIn, asyncHandler(automationController.getRule.bind(automationController)));
automationBusinessRouter.post('/automation', isOrganizationLoggedIn, asyncHandler(automationController.createRule.bind(automationController)));
automationBusinessRouter.put('/automation/:ruleId', isOrganizationLoggedIn, asyncHandler(automationController.updateRule.bind(automationController)));
automationBusinessRouter.delete('/automation/:ruleId', isOrganizationLoggedIn, asyncHandler(automationController.deleteRule.bind(automationController)));

// Manual trigger & execution logs
automationBusinessRouter.post('/automation/:ruleId/trigger', isOrganizationLoggedIn, asyncHandler(automationController.triggerRule.bind(automationController)));
automationBusinessRouter.get('/automation/:ruleId/logs', isOrganizationLoggedIn, asyncHandler(automationController.getExecutionLogs.bind(automationController)));
