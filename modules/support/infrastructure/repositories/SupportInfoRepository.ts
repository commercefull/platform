/**
 * Consolidated Support Info Repository
 *
 * Merges alertRepo, faqRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Support Info (alerts, FAQ categories/articles)
 */

import * as alertRepo from './alertRepo';
import * as faqRepo from './faqRepo';

// Re-export types for backward compatibility
export type { AlertStatus, NotificationChannel, PriceAlertType, StockAlert, PriceAlert } from './alertRepo';
export type { FaqCategory, FaqArticle } from './faqRepo';

class SupportInfoRepository {
  readonly alerts = alertRepo;
  readonly faq = faqRepo;
}

export default new SupportInfoRepository();
