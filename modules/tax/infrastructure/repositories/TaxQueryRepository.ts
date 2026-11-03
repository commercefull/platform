/**
 * Consolidated Tax Query Repository
 *
 * Merges taxQueryRepo and the admin tax surface into a single
 * aggregate-aligned repository.
 *
 * Aggregate: Tax Configuration (rates, zones, rules, settings, nexus, reports, admin views)
 */

import taxQueryRepo from './taxQueryRepo';
import {
  findAllTaxRates,
  createTaxRate,
  updateTaxRate,
  softDeleteTaxRate,
  findAllTaxZones,
  createTaxZone,
  updateTaxZone,
  softDeleteTaxZone,
  findAllTaxClasses,
  createTaxClass,
  updateTaxClass,
  softDeleteTaxClass,
} from './adminTaxRepo';

const adminTaxRepo = {
  findAllTaxRates,
  createTaxRate,
  updateTaxRate,
  softDeleteTaxRate,
  findAllTaxZones,
  createTaxZone,
  updateTaxZone,
  softDeleteTaxZone,
  findAllTaxClasses,
  createTaxClass,
  updateTaxClass,
  softDeleteTaxClass,
};

class TaxQueryRepository {
  readonly query = taxQueryRepo;
  readonly admin = adminTaxRepo;
}

export default new TaxQueryRepository();
