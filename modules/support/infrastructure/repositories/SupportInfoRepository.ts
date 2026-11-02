/**
 * Consolidated Support Info Repository
 *
 * Merges alertRepo, faqRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Support Info (alerts, FAQ categories/articles)
 */

import {
  getStockAlert,
  getStockAlerts,
  getActiveStockAlertsForProduct,
  createStockAlert,
  notifyStockAlert,
  cancelStockAlert,
  getPriceAlert,
  getPriceAlerts,
  getPriceAlertsToNotify,
  createPriceAlert,
  notifyPriceAlert,
  cancelPriceAlert,
  updatePriceAlertCurrentPrice,
} from './alertRepo';
import {
  getCategory,
  getArticle,
  getCategoryBySlug,
  getCategories,
  getFeaturedCategories,
  saveCategory,
  deleteCategory,
  getArticleBySlug,
  getArticles,
  searchArticles,
  getPopularArticles,
  getRelatedArticles,
  saveArticle,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  incrementViews,
  submitHelpfulVote,
} from './faqRepo';

// Re-export types for backward compatibility
export type { AlertStatus, NotificationChannel, PriceAlertType, StockAlert, PriceAlert } from './alertRepo';
export type { FaqCategory, FaqArticle } from './faqRepo';

const alertRepo = {
  getStockAlert,
  getStockAlerts,
  getActiveStockAlertsForProduct,
  createStockAlert,
  notifyStockAlert,
  cancelStockAlert,
  getPriceAlert,
  getPriceAlerts,
  getPriceAlertsToNotify,
  createPriceAlert,
  notifyPriceAlert,
  cancelPriceAlert,
  updatePriceAlertCurrentPrice,
};

const faqRepo = {
  getCategory,
  getArticle,
  getCategoryBySlug,
  getCategories,
  getFeaturedCategories,
  saveCategory,
  deleteCategory,
  getArticleBySlug,
  getArticles,
  searchArticles,
  getPopularArticles,
  getRelatedArticles,
  saveArticle,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  incrementViews,
  submitHelpfulVote,
};

class SupportInfoRepository {
  readonly alerts = alertRepo;
  readonly faq = faqRepo;
}

export default new SupportInfoRepository();
