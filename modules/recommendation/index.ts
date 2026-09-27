/**
 * Recommendation Module
 * Deterministic product recommendations: manual links (product module),
 * rules, frequently-bought-together, similarity, popular fallback — no AI.
 * See docs/modules/recommendation.md.
 */

export * from './application/useCases';
export * from './domain/entities/RecommendationCandidate';
export * from './domain/entities/RecommendationRule';
export * from './domain/entities/RecommendationExclusion';
export * from './domain/valueObjects/Placement';
export * from './domain/repositories/CoPurchaseRepository';
export * from './domain/repositories/CandidateRepository';
export * from './domain/repositories/RuleRepository';
export * from './domain/events/RecommendationEvents';
export * from './domain/errors/RecommendationErrors';

export { recommendationCustomerRouter } from './interface/routers/recommendationCustomerRouter';
export { recommendationBusinessRouter } from './interface/routers/recommendationBusinessRouter';
export {
  recommendationsDashboard,
  createRecommendationRule,
  deleteRecommendationRule,
  createRecommendationExclusion,
  deleteRecommendationExclusion,
  productSuggestionsPartial,
  acceptProductSuggestion,
  hideProductSuggestion,
} from './interface/controllers/adminRecommendationController';

export { manifest } from './manifest';
