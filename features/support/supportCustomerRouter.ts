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

router.get('/faq/categories', getFaqCategories);
router.get('/faq/categories/featured', getFeaturedFaqCategories);
router.get('/faq/categories/:slug', getFaqCategoryBySlug);
router.get('/faq/articles/popular', getPopularFaqArticles);
router.get('/faq/articles/:slug', getFaqArticleBySlug);
router.get('/faq/search', searchFaq);
router.post('/faq/articles/:id/feedback', submitFaqFeedback);

// ============================================================================
// Ticket Routes (Authenticated)
// ============================================================================

router.post('/tickets', createTicket);
router.get('/tickets/mine', getMyTickets);
router.get('/tickets/mine/:id', getMyTicket);
router.post('/tickets/mine/:id/messages', addCustomerMessage);
router.post('/tickets/mine/:id/feedback', submitTicketFeedback);

// ============================================================================
// Stock Alert Routes
// ============================================================================

router.post('/alerts/stock', createStockAlert);
router.get('/alerts/stock/mine', getMyStockAlerts);
router.delete('/alerts/stock/mine/:id', cancelMyStockAlert);

// ============================================================================
// Price Alert Routes
// ============================================================================

router.post('/alerts/price', createPriceAlert);
router.get('/alerts/price/mine', getMyPriceAlerts);
router.delete('/alerts/price/mine/:id', cancelMyPriceAlert);

export const supportCustomerRouter = router;
export default router;
