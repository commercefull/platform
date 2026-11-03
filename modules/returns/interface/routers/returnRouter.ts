import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import returnController from '../controllers/returnController';

export const returnBusinessRouter = createHttpRouter();

// Return request CRUD + workflow
returnBusinessRouter.get('/returns', isOrganizationLoggedIn, asyncHandler(returnController.listReturns));
returnBusinessRouter.get('/returns/:returnId', isOrganizationLoggedIn, asyncHandler(returnController.getReturn));
returnBusinessRouter.post('/returns', isOrganizationLoggedIn, asyncHandler(returnController.createReturn));
returnBusinessRouter.post('/returns/:returnId/approve', isOrganizationLoggedIn, asyncHandler(returnController.approveReturn));
returnBusinessRouter.post('/returns/:returnId/deny', isOrganizationLoggedIn, asyncHandler(returnController.denyReturn));
returnBusinessRouter.post('/returns/:returnId/in-transit', isOrganizationLoggedIn, asyncHandler(returnController.markInTransit));
returnBusinessRouter.post('/returns/:returnId/received', isOrganizationLoggedIn, asyncHandler(returnController.markReceived));
returnBusinessRouter.post('/returns/:returnId/inspect', isOrganizationLoggedIn, asyncHandler(returnController.completeInspection));
returnBusinessRouter.post('/returns/:returnId/complete', isOrganizationLoggedIn, asyncHandler(returnController.completeReturn));
returnBusinessRouter.post('/returns/:returnId/cancel', isOrganizationLoggedIn, asyncHandler(returnController.cancelReturn));

// Store credit
returnBusinessRouter.get('/store-credit/balance', isOrganizationLoggedIn, asyncHandler(returnController.getStoreCreditBalance));
returnBusinessRouter.get('/store-credit/ledger', isOrganizationLoggedIn, asyncHandler(returnController.getStoreCreditLedger));
returnBusinessRouter.post('/store-credit/debit', isOrganizationLoggedIn, asyncHandler(returnController.debitStoreCredit));
