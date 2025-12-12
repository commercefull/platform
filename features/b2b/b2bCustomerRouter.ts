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
  processApproval
} from './controllers/b2bCustomerController';

const router = Router();

// ============================================================================
// Company Registration (Public)
// ============================================================================

router.post('/register', registerCompany);
router.post('/invite/accept', acceptInvite);

// ============================================================================
// My Company (Requires B2B auth)
// ============================================================================

router.get('/company', getMyCompany);
router.put('/company', updateMyCompany);

// Company Users
router.get('/company/users', getMyCompanyUsers);
router.post('/company/users/invite', inviteCompanyUser);
router.put('/company/users/:userId', updateCompanyUser);
router.delete('/company/users/:userId', removeCompanyUser);

// Company Addresses
router.get('/company/addresses', getMyCompanyAddresses);
router.post('/company/addresses', addCompanyAddress);
router.put('/company/addresses/:addressId', updateCompanyAddress);
router.delete('/company/addresses/:addressId', deleteCompanyAddress);

// ============================================================================
// Quotes
// ============================================================================

router.get('/quotes', getMyQuotes);
router.get('/quotes/:id', getQuote);
router.post('/quotes/request', requestQuote);
router.post('/quotes/:id/accept', acceptQuote);
router.post('/quotes/:id/reject', rejectQuote);

// ============================================================================
// Approvals
// ============================================================================

router.get('/approvals/mine', getMyApprovalRequests);
router.get('/approvals/pending', getPendingApprovals);
router.post('/approvals/:id/action', processApproval);

export const b2bCustomerRouter = router;
export default router;
