/**
 * Support Customer Router
 * Routes for customer-facing support operations
 */

import { Router } from 'express';
import {
  // Tickets
  createTicket,
  getMyTickets,
  getMyTicket,
  addCustomerMessage,
  submitTicketFeedback,
  // FAQ
  getFaqCategories,
  getFeaturedFaqCategories,
  getFaqCategoryBySlug,
  getFaqArticleBySlug,
  searchFaq,
  getPopularFaqArticles,
  submitFaqFeedback,
  // Stock Alerts
  createStockAlert,
  getMyStockAlerts,
  cancelMyStockAlert,
  // Price Alerts
  createPriceAlert,
  getMyPriceAlerts,
  cancelMyPriceAlert
} from './controllers/supportCustomerController';

const router = Router();

// ============================================================================
// FAQ Routes (Public)
// ============================================================================

router.get('/support/faq/categories', getFaqCategories);
router.get('/support/faq/categories/featured', getFeaturedFaqCategories);
router.get('/support/faq/categories/:slug', getFaqCategoryBySlug);
router.get('/support/faq/articles/popular', getPopularFaqArticles);
router.get('/support/faq/articles/:slug', getFaqArticleBySlug);
router.get('/support/faq/search', searchFaq);
router.post('/support/faq/articles/:id/feedback', submitFaqFeedback);

// ============================================================================
// Ticket Routes (Authenticated)
// ============================================================================

router.post('/support/tickets', createTicket);
router.get('/support/tickets/mine', getMyTickets);
router.get('/support/tickets/mine/:id', getMyTicket);
router.post('/support/tickets/mine/:id/messages', addCustomerMessage);
router.post('/support/tickets/mine/:id/feedback', submitTicketFeedback);

// ============================================================================
// Stock Alert Routes
// ============================================================================

router.post('/support/alerts/stock', createStockAlert);
router.get('/support/alerts/stock/mine', getMyStockAlerts);
router.delete('/support/alerts/stock/mine/:id', cancelMyStockAlert);

// ============================================================================
// Price Alert Routes
// ============================================================================

router.post('/support/alerts/price', createPriceAlert);
router.get('/support/alerts/price/mine', getMyPriceAlerts);
router.delete('/support/alerts/price/mine/:id', cancelMyPriceAlert);

export const supportCustomerRouter = router;
