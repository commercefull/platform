/**
 * B2B Business Router
 * Routes for admin/merchant B2B operations
 */

import { Router } from 'express';
import { isMerchantLoggedIn } from '../../libs/auth';
import {
  // Companies
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  approveCompany,
  suspendCompany,
  deleteCompany,
  // Company Users
  getCompanyUsers,
  createCompanyUser,
  updateCompanyUser,
  deleteCompanyUser,
  // Company Addresses
  getCompanyAddresses,
  createCompanyAddress,
  updateCompanyAddress,
  deleteCompanyAddress,
  // Quotes
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  sendQuote,
  deleteQuote,
  addQuoteItem,
  updateQuoteItem,
  deleteQuoteItem,
  // Approval Workflows
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  // Approval Requests
  getApprovalRequests,
  getApprovalRequest,
  processApprovalAction
} from './controllers/b2bBusinessController';

const router = Router();

router.use(isMerchantLoggedIn);

// ============================================================================
// Company Routes
// ============================================================================

router.get('/b2b/companies', getCompanies);
router.get('/b2b/companies/:id', getCompany);
router.post('/b2b/companies', createCompany);
router.put('/b2b/companies/:id', updateCompany);
router.post('/b2b/companies/:id/approve', approveCompany);
router.post('/b2b/companies/:id/suspend', suspendCompany);
router.delete('/b2b/companies/:id', deleteCompany);

// Company Users
router.get('/b2b/companies/:companyId/users', getCompanyUsers);
router.post('/b2b/companies/:companyId/users', createCompanyUser);
router.put('/b2b/companies/:companyId/users/:userId', updateCompanyUser);
router.delete('/b2b/companies/:companyId/users/:userId', deleteCompanyUser);

// Company Addresses
router.get('/b2b/companies/:companyId/addresses', getCompanyAddresses);
router.post('/b2b/companies/:companyId/addresses', createCompanyAddress);
router.put('/b2b/companies/:companyId/addresses/:addressId', updateCompanyAddress);
router.delete('/b2b/companies/:companyId/addresses/:addressId', deleteCompanyAddress);

// ============================================================================
// Quote Routes
// ============================================================================

router.get('/b2b/quotes', getQuotes);
router.get('/b2b/quotes/:id', getQuote);
router.post('/b2b/quotes', createQuote);
router.put('/b2b/quotes/:id', updateQuote);
router.post('/b2b/quotes/:id/send', sendQuote);
router.delete('/b2b/quotes/:id', deleteQuote);

// Quote Items
router.post('/b2b/quotes/:id/items', addQuoteItem);
router.put('/b2b/quotes/:id/items/:itemId', updateQuoteItem);
router.delete('/b2b/quotes/:id/items/:itemId', deleteQuoteItem);

// ============================================================================
// Approval Workflow Routes
// ============================================================================

router.get('/b2b/workflows', getWorkflows);
router.get('/b2b/workflows/:id', getWorkflow);
router.post('/b2b/workflows', createWorkflow);
router.put('/b2b/workflows/:id', updateWorkflow);
router.delete('/b2b/workflows/:id', deleteWorkflow);

// ============================================================================
// Approval Request Routes
// ============================================================================

router.get('/b2b/approvals', getApprovalRequests);
router.get('/b2b/approvals/:id', getApprovalRequest);
router.post('/b2b/approvals/:id/action', processApprovalAction);

export const b2bBusinessRouter = router;
