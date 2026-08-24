/**
 * Consolidated Tax Query Repository
 *
 * Merges taxQueryRepo, taxRateRepo, taxZoneRepo, taxRuleRepo, taxSettingsRepo,
 * taxNexusRepo, taxReportRepo, and adminTaxRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Tax Configuration (rates, zones, rules, settings, nexus, reports, admin views)
 */

import taxQueryRepo from './taxQueryRepo';
import taxRateRepo from './taxRateRepo';
import taxZoneRepo from './taxZoneRepo';
import taxRuleRepo from './taxRuleRepo';
import taxSettingsRepo from './taxSettingsRepo';
import taxNexusRepo from './taxNexusRepo';
import taxReportRepo from './taxReportRepo';
import * as adminTaxRepo from './adminTaxRepo';

class TaxQueryRepository {
  readonly query = taxQueryRepo;
  readonly rates = taxRateRepo;
  readonly zones = taxZoneRepo;
  readonly rules = taxRuleRepo;
  readonly settings = taxSettingsRepo;
  readonly nexus = taxNexusRepo;
  readonly reports = taxReportRepo;
  readonly admin = adminTaxRepo;
}

export default new TaxQueryRepository();
