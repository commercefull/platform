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

router.get('/companies', getCompanies);
router.get('/companies/:id', getCompany);
router.post('/companies', createCompany);
router.put('/companies/:id', updateCompany);
router.post('/companies/:id/approve', approveCompany);
router.post('/companies/:id/suspend', suspendCompany);
router.delete('/companies/:id', deleteCompany);

// Company Users
router.get('/companies/:companyId/users', getCompanyUsers);
router.post('/companies/:companyId/users', createCompanyUser);
router.put('/companies/:companyId/users/:userId', updateCompanyUser);
router.delete('/companies/:companyId/users/:userId', deleteCompanyUser);

// Company Addresses
router.get('/companies/:companyId/addresses', getCompanyAddresses);
router.post('/companies/:companyId/addresses', createCompanyAddress);
router.put('/companies/:companyId/addresses/:addressId', updateCompanyAddress);
router.delete('/companies/:companyId/addresses/:addressId', deleteCompanyAddress);

// ============================================================================
// Quote Routes
// ============================================================================

router.get('/quotes', getQuotes);
router.get('/quotes/:id', getQuote);
router.post('/quotes', createQuote);
router.put('/quotes/:id', updateQuote);
router.post('/quotes/:id/send', sendQuote);
router.delete('/quotes/:id', deleteQuote);

// Quote Items
router.post('/quotes/:id/items', addQuoteItem);
router.put('/quotes/:id/items/:itemId', updateQuoteItem);
router.delete('/quotes/:id/items/:itemId', deleteQuoteItem);

// ============================================================================
// Approval Workflow Routes
// ============================================================================

router.get('/workflows', getWorkflows);
router.get('/workflows/:id', getWorkflow);
router.post('/workflows', createWorkflow);
router.put('/workflows/:id', updateWorkflow);
router.delete('/workflows/:id', deleteWorkflow);

// ============================================================================
// Approval Request Routes
// ============================================================================

router.get('/approvals', getApprovalRequests);
router.get('/approvals/:id', getApprovalRequest);
router.post('/approvals/:id/action', processApprovalAction);

export const b2bBusinessRouter = router;
export default router;
