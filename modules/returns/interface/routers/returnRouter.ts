import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import returnController from '../controllers/returnController';

export const returnBusinessRouter = express.Router();

// Return request CRUD + workflow
returnBusinessRouter.get('/returns', isOrganizationLoggedIn, asyncHandler(returnController.listReturns.bind(returnController)));
returnBusinessRouter.get('/returns/:returnId', isOrganizationLoggedIn, asyncHandler(returnController.getReturn.bind(returnController)));
returnBusinessRouter.post('/returns', isOrganizationLoggedIn, asyncHandler(returnController.createReturn.bind(returnController)));
returnBusinessRouter.post('/returns/:returnId/approve', isOrganizationLoggedIn, asyncHandler(returnController.approveReturn.bind(returnController)));
returnBusinessRouter.post('/returns/:returnId/deny', isOrganizationLoggedIn, asyncHandler(returnController.denyReturn.bind(returnController)));
returnBusinessRouter.post('/returns/:returnId/in-transit', isOrganizationLoggedIn, asyncHandler(returnController.markInTransit.bind(returnController)));
returnBusinessRouter.post('/returns/:returnId/received', isOrganizationLoggedIn, asyncHandler(returnController.markReceived.bind(returnController)));
returnBusinessRouter.post('/returns/:returnId/inspect', isOrganizationLoggedIn, asyncHandler(returnController.completeInspection.bind(returnController)));
returnBusinessRouter.post('/returns/:returnId/complete', isOrganizationLoggedIn, asyncHandler(returnController.completeReturn.bind(returnController)));
returnBusinessRouter.post('/returns/:returnId/cancel', isOrganizationLoggedIn, asyncHandler(returnController.cancelReturn.bind(returnController)));

// Store credit
returnBusinessRouter.get('/store-credit/balance', isOrganizationLoggedIn, asyncHandler(returnController.getStoreCreditBalance.bind(returnController)));
returnBusinessRouter.get('/store-credit/ledger', isOrganizationLoggedIn, asyncHandler(returnController.getStoreCreditLedger.bind(returnController)));
returnBusinessRouter.post('/store-credit/debit', isOrganizationLoggedIn, asyncHandler(returnController.debitStoreCredit.bind(returnController)));
