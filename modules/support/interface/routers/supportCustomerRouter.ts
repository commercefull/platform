/**
 * Support Customer Router
 * Routes for customer-facing support operations
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isCustomerLoggedIn } from '../../../../libs/auth';
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
  cancelMyPriceAlert,
} from '../controllers/supportCustomerController';

const router = Router();

// ============================================================================
// FAQ Routes (Public)
// ============================================================================

router.get('/support/faq/categories', asyncHandler(getFaqCategories));
router.get('/support/faq/categories/featured', asyncHandler(getFeaturedFaqCategories));
router.get('/support/faq/categories/:slug', asyncHandler(getFaqCategoryBySlug));
router.get('/support/faq/articles/popular', asyncHandler(getPopularFaqArticles));
router.get('/support/faq/articles/:slug', asyncHandler(getFaqArticleBySlug));
router.get('/support/faq/search', asyncHandler(searchFaq));
router.post('/support/faq/articles/:id/feedback', asyncHandler(submitFaqFeedback));

// ============================================================================
// Ticket Routes (Authenticated)
// ============================================================================

router.post('/support/tickets', isCustomerLoggedIn, asyncHandler(createTicket));
router.get('/support/tickets/mine', isCustomerLoggedIn, asyncHandler(getMyTickets));
router.get('/support/tickets/mine/:id', isCustomerLoggedIn, asyncHandler(getMyTicket));
router.post('/support/tickets/mine/:id/messages', isCustomerLoggedIn, asyncHandler(addCustomerMessage));
router.post('/support/tickets/mine/:id/feedback', isCustomerLoggedIn, asyncHandler(submitTicketFeedback));

// ============================================================================
// Stock Alert Routes
// ============================================================================

router.post('/support/alerts/stock', isCustomerLoggedIn, asyncHandler(createStockAlert));
router.get('/support/alerts/stock/mine', isCustomerLoggedIn, asyncHandler(getMyStockAlerts));
router.delete('/support/alerts/stock/mine/:id', isCustomerLoggedIn, asyncHandler(cancelMyStockAlert));

// ============================================================================
// Price Alert Routes
// ============================================================================

router.post('/support/alerts/price', isCustomerLoggedIn, asyncHandler(createPriceAlert));
router.get('/support/alerts/price/mine', isCustomerLoggedIn, asyncHandler(getMyPriceAlerts));
router.delete('/support/alerts/price/mine/:id', isCustomerLoggedIn, asyncHandler(cancelMyPriceAlert));

export const supportCustomerRouter = router;
