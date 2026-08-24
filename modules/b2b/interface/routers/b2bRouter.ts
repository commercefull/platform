import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { b2bController } from '../../application/useCases/wired';

export const b2bBusinessRouter = express.Router();

// Company CRUD + lifecycle
b2bBusinessRouter.get('/companies', isOrganizationLoggedIn, asyncHandler(b2bController.listCompanies.bind(b2bController)));
b2bBusinessRouter.get('/companies/:companyId', isOrganizationLoggedIn, asyncHandler(b2bController.getCompany.bind(b2bController)));
b2bBusinessRouter.post('/companies', isOrganizationLoggedIn, asyncHandler(b2bController.createCompany.bind(b2bController)));
b2bBusinessRouter.put('/companies/:companyId', isOrganizationLoggedIn, asyncHandler(b2bController.updateCompany.bind(b2bController)));
b2bBusinessRouter.put('/companies/:companyId/payment-terms', isOrganizationLoggedIn, asyncHandler(b2bController.setPaymentTerms.bind(b2bController)));
b2bBusinessRouter.put('/companies/:companyId/credit-limit', isOrganizationLoggedIn, asyncHandler(b2bController.setCreditLimit.bind(b2bController)));
b2bBusinessRouter.post('/companies/:companyId/approve', isOrganizationLoggedIn, asyncHandler(b2bController.approveCompany.bind(b2bController)));
b2bBusinessRouter.post('/companies/:companyId/suspend', isOrganizationLoggedIn, asyncHandler(b2bController.suspendCompany.bind(b2bController)));
b2bBusinessRouter.post('/companies/:companyId/reactivate', isOrganizationLoggedIn, asyncHandler(b2bController.reactivateCompany.bind(b2bController)));
b2bBusinessRouter.post('/companies/:companyId/terminate', isOrganizationLoggedIn, asyncHandler(b2bController.terminateCompany.bind(b2bController)));
b2bBusinessRouter.get('/companies/:companyId/subsidiaries', isOrganizationLoggedIn, asyncHandler(b2bController.listSubsidiaries.bind(b2bController)));

// B2B User management
b2bBusinessRouter.get('/users', isOrganizationLoggedIn, asyncHandler(b2bController.listUsers.bind(b2bController)));
b2bBusinessRouter.get('/users/:userId', isOrganizationLoggedIn, asyncHandler(b2bController.getUser.bind(b2bController)));
b2bBusinessRouter.post('/users/invite', isOrganizationLoggedIn, asyncHandler(b2bController.inviteUser.bind(b2bController)));
b2bBusinessRouter.post('/users/:userId/activate', isOrganizationLoggedIn, asyncHandler(b2bController.activateUser.bind(b2bController)));
b2bBusinessRouter.post('/users/:userId/suspend', isOrganizationLoggedIn, asyncHandler(b2bController.suspendUser.bind(b2bController)));
b2bBusinessRouter.post('/users/:userId/reactivate', isOrganizationLoggedIn, asyncHandler(b2bController.reactivateUser.bind(b2bController)));
b2bBusinessRouter.delete('/users/:userId', isOrganizationLoggedIn, asyncHandler(b2bController.removeUser.bind(b2bController)));
b2bBusinessRouter.put('/users/:userId/role', isOrganizationLoggedIn, asyncHandler(b2bController.setUserRole.bind(b2bController)));
b2bBusinessRouter.put('/users/:userId/spending-limits', isOrganizationLoggedIn, asyncHandler(b2bController.setSpendingLimits.bind(b2bController)));
b2bBusinessRouter.put('/users/:userId/profile', isOrganizationLoggedIn, asyncHandler(b2bController.updateUserProfile.bind(b2bController)));

// Quote management
b2bBusinessRouter.get('/quotes', isOrganizationLoggedIn, asyncHandler(b2bController.listQuotes.bind(b2bController)));
b2bBusinessRouter.get('/quotes/:quoteId', isOrganizationLoggedIn, asyncHandler(b2bController.getQuote.bind(b2bController)));
b2bBusinessRouter.post('/quotes', isOrganizationLoggedIn, asyncHandler(b2bController.createQuote.bind(b2bController)));
b2bBusinessRouter.post('/quotes/:quoteId/line-items', isOrganizationLoggedIn, asyncHandler(b2bController.addQuoteLineItem.bind(b2bController)));
b2bBusinessRouter.put('/quotes/:quoteId/line-items/:lineItemId', isOrganizationLoggedIn, asyncHandler(b2bController.updateQuoteLineItem.bind(b2bController)));
b2bBusinessRouter.delete('/quotes/:quoteId/line-items/:lineItemId', isOrganizationLoggedIn, asyncHandler(b2bController.removeQuoteLineItem.bind(b2bController)));
b2bBusinessRouter.post('/quotes/:quoteId/send', isOrganizationLoggedIn, asyncHandler(b2bController.sendQuote.bind(b2bController)));
b2bBusinessRouter.post('/quotes/:quoteId/viewed', isOrganizationLoggedIn, asyncHandler(b2bController.markQuoteViewed.bind(b2bController)));
b2bBusinessRouter.post('/quotes/:quoteId/accept', isOrganizationLoggedIn, asyncHandler(b2bController.acceptQuote.bind(b2bController)));
b2bBusinessRouter.post('/quotes/:quoteId/reject', isOrganizationLoggedIn, asyncHandler(b2bController.rejectQuote.bind(b2bController)));
b2bBusinessRouter.post('/quotes/:quoteId/convert', isOrganizationLoggedIn, asyncHandler(b2bController.convertQuote.bind(b2bController)));
b2bBusinessRouter.put('/quotes/:quoteId/notes', isOrganizationLoggedIn, asyncHandler(b2bController.setQuoteNotes.bind(b2bController)));
b2bBusinessRouter.put('/quotes/:quoteId/internal-notes', isOrganizationLoggedIn, asyncHandler(b2bController.setQuoteInternalNotes.bind(b2bController)));

// Approval workflows
b2bBusinessRouter.get('/approvals', isOrganizationLoggedIn, asyncHandler(b2bController.listApprovals.bind(b2bController)));
b2bBusinessRouter.get('/approvals/:workflowId', isOrganizationLoggedIn, asyncHandler(b2bController.getApproval.bind(b2bController)));
b2bBusinessRouter.post('/approvals', isOrganizationLoggedIn, asyncHandler(b2bController.createApproval.bind(b2bController)));
b2bBusinessRouter.post('/approvals/:workflowId/approve', isOrganizationLoggedIn, asyncHandler(b2bController.approveWorkflow.bind(b2bController)));
b2bBusinessRouter.post('/approvals/:workflowId/reject', isOrganizationLoggedIn, asyncHandler(b2bController.rejectWorkflow.bind(b2bController)));
b2bBusinessRouter.post('/approvals/:workflowId/escalate', isOrganizationLoggedIn, asyncHandler(b2bController.escalateWorkflow.bind(b2bController)));
b2bBusinessRouter.post('/approvals/:workflowId/cancel', isOrganizationLoggedIn, asyncHandler(b2bController.cancelWorkflow.bind(b2bController)));
