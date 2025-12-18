/**
 * Support Business Router
 * Routes for admin/merchant support operations
 */

import { Router } from 'express';
import { isMerchantLoggedIn } from '../../libs/auth';
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
  notifyPriceAlerts
} from './controllers/supportBusinessController';

const router = Router();

router.use(isMerchantLoggedIn);

// ============================================================================
// Agent Routes
// ============================================================================

router.get('/support/agents', getAgents);
router.get('/support/agents/:id', getAgent);
router.post('/support/agents', createAgent);
router.put('/support/agents/:id', updateAgent);

// ============================================================================
// Ticket Routes
// ============================================================================

router.get('/support/tickets', getTickets);
router.get('/support/tickets/:id', getTicket);
router.put('/support/tickets/:id', updateTicket);
router.post('/support/tickets/:id/assign', assignTicket);
router.post('/support/tickets/:id/resolve', resolveTicket);
router.post('/support/tickets/:id/close', closeTicket);
router.post('/support/tickets/:id/escalate', escalateTicket);
router.post('/support/tickets/:id/messages', addAgentMessage);

// ============================================================================
// FAQ Category Routes
// ============================================================================

router.get('/support/faq/categories', getFaqCategories);
router.get('/support/faq/categories/:id', getFaqCategory);
router.post('/support/faq/categories', createFaqCategory);
router.put('/support/faq/categories/:id', updateFaqCategory);
router.delete('/support/faq/categories/:id', deleteFaqCategory);

// ============================================================================
// FAQ Article Routes
// ============================================================================

router.get('/support/faq/articles', getFaqArticles);
router.get('/support/faq/articles/:id', getFaqArticle);
router.post('/support/faq/articles', createFaqArticle);
router.put('/support/faq/articles/:id', updateFaqArticle);
router.post('/support/faq/articles/:id/publish', publishFaqArticle);
router.post('/support/faq/articles/:id/unpublish', unpublishFaqArticle);
router.delete('/support/faq/articles/:id', deleteFaqArticle);

// ============================================================================
// Alert Routes
// ============================================================================

router.get('/support/alerts/stock', getStockAlerts);
router.get('/support/alerts/price', getPriceAlerts);
router.post('/support/alerts/stock/notify', notifyStockAlerts);
router.post('/support/alerts/price/notify', notifyPriceAlerts);

export const supportBusinessRouter = router;
