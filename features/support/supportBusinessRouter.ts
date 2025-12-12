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

router.get('/agents', getAgents);
router.get('/agents/:id', getAgent);
router.post('/agents', createAgent);
router.put('/agents/:id', updateAgent);

// ============================================================================
// Ticket Routes
// ============================================================================

router.get('/tickets', getTickets);
router.get('/tickets/:id', getTicket);
router.put('/tickets/:id', updateTicket);
router.post('/tickets/:id/assign', assignTicket);
router.post('/tickets/:id/resolve', resolveTicket);
router.post('/tickets/:id/close', closeTicket);
router.post('/tickets/:id/escalate', escalateTicket);
router.post('/tickets/:id/messages', addAgentMessage);

// ============================================================================
// FAQ Category Routes
// ============================================================================

router.get('/faq/categories', getFaqCategories);
router.get('/faq/categories/:id', getFaqCategory);
router.post('/faq/categories', createFaqCategory);
router.put('/faq/categories/:id', updateFaqCategory);
router.delete('/faq/categories/:id', deleteFaqCategory);

// ============================================================================
// FAQ Article Routes
// ============================================================================

router.get('/faq/articles', getFaqArticles);
router.get('/faq/articles/:id', getFaqArticle);
router.post('/faq/articles', createFaqArticle);
router.put('/faq/articles/:id', updateFaqArticle);
router.post('/faq/articles/:id/publish', publishFaqArticle);
router.post('/faq/articles/:id/unpublish', unpublishFaqArticle);
router.delete('/faq/articles/:id', deleteFaqArticle);

// ============================================================================
// Alert Routes
// ============================================================================

router.get('/alerts/stock', getStockAlerts);
router.get('/alerts/price', getPriceAlerts);
router.post('/alerts/stock/notify', notifyStockAlerts);
router.post('/alerts/price/notify', notifyPriceAlerts);

export const supportBusinessRouter = router;
export default router;
