/**
 * Recommendation module composition root — wires concrete infrastructure
 * implementations into the use cases.
 */

import signalRepo, { processedOrderRepo } from '../../infrastructure/repositories/recommendationSignalRepo';
import candidateRepo from '../../infrastructure/repositories/recommendationCandidateRepo';
import { recommendationRuleRepo, recommendationExclusionRepo } from '../../infrastructure/repositories/recommendationRuleRepo';
import { ProductCatalogAdapter } from '../../infrastructure/acl/ProductCatalogAdapter';
import { OrderLinesAdapter } from '../../infrastructure/acl/OrderLinesAdapter';
import { StaticRecommendationConfigAdapter } from '../../infrastructure/acl/StaticRecommendationConfigAdapter';

import { GetRecommendationsUseCase } from './GetRecommendations';
import { RecordOrderCoPurchaseUseCase } from './RecordOrderCoPurchase';
import { RebuildRecommendationsUseCase } from './RebuildRecommendations';
import { BackfillCoPurchaseUseCase } from './BackfillCoPurchase';
import { ManageRecommendationRulesUseCase } from './ManageRecommendationRules';
import { ManageRecommendationExclusionsUseCase } from './ManageRecommendationExclusions';
import { ListProductSuggestionsUseCase } from './ListProductSuggestions';
import { GetRecommendationStatsUseCase } from './GetRecommendationStats';

const catalogPort = new ProductCatalogAdapter();
/** Exported for interface-layer lookups that need catalog data (e.g. resolving a product's org). */
export const recommendationCatalogPort = catalogPort;
const orderLinesPort = new OrderLinesAdapter();
const configPort = new StaticRecommendationConfigAdapter();

export const getRecommendationsUseCase = new GetRecommendationsUseCase(candidateRepo, recommendationExclusionRepo, catalogPort, configPort);
export const recordOrderCoPurchaseUseCase = new RecordOrderCoPurchaseUseCase(signalRepo, processedOrderRepo, orderLinesPort, configPort);
export const rebuildRecommendationsUseCase = new RebuildRecommendationsUseCase(
  signalRepo,
  candidateRepo,
  recommendationRuleRepo,
  catalogPort,
  configPort,
);
export const backfillCoPurchaseUseCase = new BackfillCoPurchaseUseCase(
  orderLinesPort,
  recordOrderCoPurchaseUseCase,
  rebuildRecommendationsUseCase,
);
export const manageRecommendationRulesUseCase = new ManageRecommendationRulesUseCase(recommendationRuleRepo);
export const manageRecommendationExclusionsUseCase = new ManageRecommendationExclusionsUseCase(recommendationExclusionRepo);
export const listProductSuggestionsUseCase = new ListProductSuggestionsUseCase(candidateRepo, recommendationExclusionRepo, catalogPort);
export const getRecommendationStatsUseCase = new GetRecommendationStatsUseCase(candidateRepo);
