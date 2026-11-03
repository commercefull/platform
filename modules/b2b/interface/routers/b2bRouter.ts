import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import { b2bController } from '../../application/useCases/wired';

export const b2bBusinessRouter = createHttpRouter();

// Company CRUD + lifecycle
b2bBusinessRouter.get('/companies', isOrganizationLoggedIn, asyncHandler(b2bController.listCompanies));
b2bBusinessRouter.get('/companies/:companyId', isOrganizationLoggedIn, asyncHandler(b2bController.getCompany));
b2bBusinessRouter.post('/companies', isOrganizationLoggedIn, asyncHandler(b2bController.createCompany));
b2bBusinessRouter.put('/companies/:companyId', isOrganizationLoggedIn, asyncHandler(b2bController.updateCompany));
b2bBusinessRouter.put('/companies/:companyId/payment-terms', isOrganizationLoggedIn, asyncHandler(b2bController.setPaymentTerms));
b2bBusinessRouter.put('/companies/:companyId/credit-limit', isOrganizationLoggedIn, asyncHandler(b2bController.setCreditLimit));
b2bBusinessRouter.post('/companies/:companyId/approve', isOrganizationLoggedIn, asyncHandler(b2bController.approveCompany));
b2bBusinessRouter.post('/companies/:companyId/suspend', isOrganizationLoggedIn, asyncHandler(b2bController.suspendCompany));
b2bBusinessRouter.post('/companies/:companyId/reactivate', isOrganizationLoggedIn, asyncHandler(b2bController.reactivateCompany));
b2bBusinessRouter.post('/companies/:companyId/terminate', isOrganizationLoggedIn, asyncHandler(b2bController.terminateCompany));
b2bBusinessRouter.get('/companies/:companyId/subsidiaries', isOrganizationLoggedIn, asyncHandler(b2bController.listSubsidiaries));

// B2B User management
b2bBusinessRouter.get('/users', isOrganizationLoggedIn, asyncHandler(b2bController.listUsers));
b2bBusinessRouter.get('/users/:userId', isOrganizationLoggedIn, asyncHandler(b2bController.getUser));
b2bBusinessRouter.post('/users/invite', isOrganizationLoggedIn, asyncHandler(b2bController.inviteUser));
b2bBusinessRouter.post('/users/:userId/activate', isOrganizationLoggedIn, asyncHandler(b2bController.activateUser));
b2bBusinessRouter.post('/users/:userId/suspend', isOrganizationLoggedIn, asyncHandler(b2bController.suspendUser));
b2bBusinessRouter.post('/users/:userId/reactivate', isOrganizationLoggedIn, asyncHandler(b2bController.reactivateUser));
b2bBusinessRouter.delete('/users/:userId', isOrganizationLoggedIn, asyncHandler(b2bController.removeUser));
b2bBusinessRouter.put('/users/:userId/role', isOrganizationLoggedIn, asyncHandler(b2bController.setUserRole));
b2bBusinessRouter.put('/users/:userId/spending-limits', isOrganizationLoggedIn, asyncHandler(b2bController.setSpendingLimits));
b2bBusinessRouter.put('/users/:userId/profile', isOrganizationLoggedIn, asyncHandler(b2bController.updateUserProfile));

// Quote management
b2bBusinessRouter.get('/quotes', isOrganizationLoggedIn, asyncHandler(b2bController.listQuotes));
b2bBusinessRouter.get('/quotes/:quoteId', isOrganizationLoggedIn, asyncHandler(b2bController.getQuote));
b2bBusinessRouter.post('/quotes', isOrganizationLoggedIn, asyncHandler(b2bController.createQuote));
b2bBusinessRouter.post('/quotes/:quoteId/line-items', isOrganizationLoggedIn, asyncHandler(b2bController.addQuoteLineItem));
b2bBusinessRouter.put('/quotes/:quoteId/line-items/:lineItemId', isOrganizationLoggedIn, asyncHandler(b2bController.updateQuoteLineItem));
b2bBusinessRouter.delete(
  '/quotes/:quoteId/line-items/:lineItemId',
  isOrganizationLoggedIn,
  asyncHandler(b2bController.removeQuoteLineItem),
);
b2bBusinessRouter.post('/quotes/:quoteId/send', isOrganizationLoggedIn, asyncHandler(b2bController.sendQuote));
b2bBusinessRouter.post('/quotes/:quoteId/viewed', isOrganizationLoggedIn, asyncHandler(b2bController.markQuoteViewed));
b2bBusinessRouter.post('/quotes/:quoteId/accept', isOrganizationLoggedIn, asyncHandler(b2bController.acceptQuote));
b2bBusinessRouter.post('/quotes/:quoteId/reject', isOrganizationLoggedIn, asyncHandler(b2bController.rejectQuote));
b2bBusinessRouter.post('/quotes/:quoteId/convert', isOrganizationLoggedIn, asyncHandler(b2bController.convertQuote));
b2bBusinessRouter.put('/quotes/:quoteId/notes', isOrganizationLoggedIn, asyncHandler(b2bController.setQuoteNotes));
b2bBusinessRouter.put('/quotes/:quoteId/internal-notes', isOrganizationLoggedIn, asyncHandler(b2bController.setQuoteInternalNotes));

// Approval workflows
b2bBusinessRouter.get('/approvals', isOrganizationLoggedIn, asyncHandler(b2bController.listApprovals));
b2bBusinessRouter.get('/approvals/:workflowId', isOrganizationLoggedIn, asyncHandler(b2bController.getApproval));
b2bBusinessRouter.post('/approvals', isOrganizationLoggedIn, asyncHandler(b2bController.createApproval));
b2bBusinessRouter.post('/approvals/:workflowId/approve', isOrganizationLoggedIn, asyncHandler(b2bController.approveWorkflow));
b2bBusinessRouter.post('/approvals/:workflowId/reject', isOrganizationLoggedIn, asyncHandler(b2bController.rejectWorkflow));
b2bBusinessRouter.post('/approvals/:workflowId/escalate', isOrganizationLoggedIn, asyncHandler(b2bController.escalateWorkflow));
b2bBusinessRouter.post('/approvals/:workflowId/cancel', isOrganizationLoggedIn, asyncHandler(b2bController.cancelWorkflow));
