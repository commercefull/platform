/**
 * Support Business Router
 * Routes for admin/merchant support operations
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  // Agents
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  // Tickets
  getTickets,
  getTicket,
  updateTicket,
  assignTicket,
  resolveTicket,
  closeTicket,
  escalateTicket,
  addAgentMessage,
  // FAQ Categories
  getFaqCategories,
  getFaqCategory,
  createFaqCategory,
  updateFaqCategory,
  deleteFaqCategory,
  // FAQ Articles
  getFaqArticles,
  getFaqArticle,
  createFaqArticle,
  updateFaqArticle,
  publishFaqArticle,
  unpublishFaqArticle,
  deleteFaqArticle,
  // Alerts
  getStockAlerts,
  getPriceAlerts,
  notifyStockAlerts,
  notifyPriceAlerts,
} from '../controllers/supportBusinessController';

const router = Router();

router.use(isOrganizationLoggedIn);

// ============================================================================
// Agent Routes
// ============================================================================

router.get('/support/agents', asyncHandler(getAgents));
router.get('/support/agents/:id', asyncHandler(getAgent));
router.post('/support/agents', asyncHandler(createAgent));
router.put('/support/agents/:id', asyncHandler(updateAgent));

// ============================================================================
// Ticket Routes
// ============================================================================

router.get('/support/tickets', asyncHandler(getTickets));
router.get('/support/tickets/:id', asyncHandler(getTicket));
router.put('/support/tickets/:id', asyncHandler(updateTicket));
router.post('/support/tickets/:id/assign', asyncHandler(assignTicket));
router.post('/support/tickets/:id/resolve', asyncHandler(resolveTicket));
router.post('/support/tickets/:id/close', asyncHandler(closeTicket));
router.post('/support/tickets/:id/escalate', asyncHandler(escalateTicket));
router.post('/support/tickets/:id/messages', asyncHandler(addAgentMessage));

// ============================================================================
// FAQ Category Routes
// ============================================================================

router.get('/support/faq/categories', asyncHandler(getFaqCategories));
router.get('/support/faq/categories/:id', asyncHandler(getFaqCategory));
router.post('/support/faq/categories', asyncHandler(createFaqCategory));
router.put('/support/faq/categories/:id', asyncHandler(updateFaqCategory));
router.delete('/support/faq/categories/:id', asyncHandler(deleteFaqCategory));

// ============================================================================
// FAQ Article Routes
// ============================================================================

router.get('/support/faq/articles', asyncHandler(getFaqArticles));
router.get('/support/faq/articles/:id', asyncHandler(getFaqArticle));
router.post('/support/faq/articles', asyncHandler(createFaqArticle));
router.put('/support/faq/articles/:id', asyncHandler(updateFaqArticle));
router.post('/support/faq/articles/:id/publish', asyncHandler(publishFaqArticle));
router.post('/support/faq/articles/:id/unpublish', asyncHandler(unpublishFaqArticle));
router.delete('/support/faq/articles/:id', asyncHandler(deleteFaqArticle));

// ============================================================================
// Alert Routes
// ============================================================================

router.get('/support/alerts/stock', asyncHandler(getStockAlerts));
router.get('/support/alerts/price', asyncHandler(getPriceAlerts));
router.post('/support/alerts/stock/notify', asyncHandler(notifyStockAlerts));
router.post('/support/alerts/price/notify', asyncHandler(notifyPriceAlerts));

export const supportBusinessRouter = router;
