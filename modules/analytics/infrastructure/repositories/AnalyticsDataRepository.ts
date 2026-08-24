/**
 * Consolidated Analytics Data Repository
 *
 * Merges DashboardQueryRepository, adminAnalyticsRepo,
 * analyticsRepo, reportingRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Analytics (dashboard, admin analytics, sales analytics, event reporting)
 */

import DashboardQueryRepository from './DashboardQueryRepository';
import adminAnalyticsRepo from './adminAnalyticsRepo';
import * as analyticsRepo from './analyticsRepo';
import * as reportingRepo from './reportingRepo';

class AnalyticsDataRepository {
  readonly dashboard = DashboardQueryRepository;
  readonly admin = adminAnalyticsRepo;
  readonly analytics = analyticsRepo;
  readonly reporting = reportingRepo;
}

export default new AnalyticsDataRepository();
