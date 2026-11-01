/**
 * MarketReadinessFactsPort — cross-module readiness fact gathering.
 *
 * The `MarketReadinessEvaluator` domain service is pure: the use case resolves
 * a `MarketReadinessFacts` snapshot through this port (implemented by the
 * `MarketReadinessAdapter` ACL, which reads the other modules' configuration
 * tables) and hands it to the evaluator.
 */

import type { MarketReadinessFacts } from '../../domain/services/MarketReadinessEvaluator';
import type { Market } from '../../domain/entities/Market';

export interface MarketReadinessFactsPort {
  gatherFacts(market: Market): Promise<MarketReadinessFacts>;
}
