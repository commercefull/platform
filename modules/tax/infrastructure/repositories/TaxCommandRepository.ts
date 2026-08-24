/**
 * Consolidated Tax Command Repository
 *
 * Merges taxCommandRepo, taxCalculationRepo, taxCalculationLineRepo,
 * taxCalculationAppliedRepo, and taxProviderLogRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Tax Operations (commands, calculations, provider logs)
 */

import { TaxCommandRepo } from './taxCommandRepo';
import taxCalculationRepo from './taxCalculationRepo';
import taxCalculationLineRepo from './taxCalculationLineRepo';
import taxCalculationAppliedRepo from './taxCalculationAppliedRepo';
import taxProviderLogRepo from './taxProviderLogRepo';

const taxCommandRepoInstance = new TaxCommandRepo();

class TaxCommandRepository {
  readonly commands = taxCommandRepoInstance;
  readonly calculations = taxCalculationRepo;
  readonly calculationLines = taxCalculationLineRepo;
  readonly calculationApplied = taxCalculationAppliedRepo;
  readonly providerLogs = taxProviderLogRepo;
}

export default new TaxCommandRepository();
