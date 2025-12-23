/**
 * B2B Customer Router
 * Routes for customer-facing B2B operations
 */

import { Router } from 'express';
import {
  // Company Registration
  registerCompany,
  getMyCompany,
  updateMyCompany,
  // Company Users
  getMyCompanyUsers,
  inviteCompanyUser,
  acceptInvite,
  updateCompanyUser,
  removeCompanyUser,
  // Company Addresses
  getMyCompanyAddresses,
  addCompanyAddress,
  updateCompanyAddress,
  deleteCompanyAddress,
  // Quotes
  getMyQuotes,
  getQuote,
  requestQuote,
  acceptQuote,
  rejectQuote,
  // Approvals
  getMyApprovalRequests,
  getPendingApprovals,
  processApproval,
} from './controllers/b2bCustomerController';

const router = Router();

// ============================================================================
// Company Registration (Public)
// ============================================================================

router.post('/b2b/register', registerCompany);
router.post('/b2b/invite/accept', acceptInvite);

// ============================================================================
// My Company (Requires B2B auth)
// ============================================================================

router.get('/b2b/company', getMyCompany);
router.put('/b2b/company', updateMyCompany);

// Company Users
router.get('/b2b/company/users', getMyCompanyUsers);
router.post('/b2b/company/users/invite', inviteCompanyUser);
router.put('/b2b/company/users/:userId', updateCompanyUser);
router.delete('/b2b/company/users/:userId', removeCompanyUser);

// Company Addresses
router.get('/b2b/company/addresses', getMyCompanyAddresses);
router.post('/b2b/company/addresses', addCompanyAddress);
router.put('/b2b/company/addresses/:addressId', updateCompanyAddress);
router.delete('/b2b/company/addresses/:addressId', deleteCompanyAddress);

// ============================================================================
// Quotes
// ============================================================================

router.get('/b2b/quotes', getMyQuotes);
router.get('/b2b/quotes/:id', getQuote);
router.post('/b2b/quotes/request', requestQuote);
router.post('/b2b/quotes/:id/accept', acceptQuote);
router.post('/b2b/quotes/:id/reject', rejectQuote);

// ============================================================================
// Approvals
// ============================================================================

router.get('/b2b/approvals/mine', getMyApprovalRequests);
router.get('/b2b/approvals/pending', getPendingApprovals);
router.post('/b2b/approvals/:id/action', processApproval);

export const b2bCustomerRouter = router;
