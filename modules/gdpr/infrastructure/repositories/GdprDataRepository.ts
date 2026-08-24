/**
 * Consolidated GDPR Data Repository
 *
 * Merges GdprDataRequestRepo, GdprCookieConsentRepo, adminGdprRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: GDPR (data requests, cookie consent, admin operations)
 */

import { GdprDataRequestRepo, GdprCookieConsentRepo } from './GdprRepository';
import adminGdprRepo from './adminGdprRepo';

const gdprDataRequestRepoInstance = new GdprDataRequestRepo();
const gdprCookieConsentRepoInstance = new GdprCookieConsentRepo();

class GdprDataRepository {
  readonly dataRequests = gdprDataRequestRepoInstance;
  readonly cookieConsent = gdprCookieConsentRepoInstance;
  readonly admin = adminGdprRepo;
}

export default new GdprDataRepository();
