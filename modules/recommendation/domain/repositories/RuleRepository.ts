/**
 * RuleRepository + ExclusionRepository — merchant-facing CRUD for rules
 * and exclusions. Both are scoped by organization (and store when present).
 */

import type { RecommendationRuleCreateProps, RecommendationRuleProps, RecommendationRuleUpdateProps } from '../entities/RecommendationRule';
import type { RecommendationExclusionCreateProps, RecommendationExclusionProps } from '../entities/RecommendationExclusion';
import type { SignalScope } from './CoPurchaseRepository';

export interface RuleRepository {
  list(organizationId: string): Promise<RecommendationRuleProps[]>;
  findById(recommendationRuleId: string): Promise<RecommendationRuleProps | null>;
  /** Active rules matching a source key — used by the nightly resolver. */
  listActiveForSource(organizationId: string, sourceType: string, sourceId: string): Promise<RecommendationRuleProps[]>;
  /** All active rules for a tenant (nightly resolver iterates). */
  listActive(organizationId: string): Promise<RecommendationRuleProps[]>;
  create(props: RecommendationRuleCreateProps): Promise<RecommendationRuleProps>;
  update(recommendationRuleId: string, props: RecommendationRuleUpdateProps): Promise<RecommendationRuleProps | null>;
  delete(recommendationRuleId: string): Promise<boolean>;
}

export interface ExclusionRepository {
  list(organizationId: string): Promise<RecommendationExclusionProps[]>;
  create(props: RecommendationExclusionCreateProps): Promise<RecommendationExclusionProps>;
  delete(recommendationExclusionId: string): Promise<boolean>;
  /** Pair exclusions keyed `sourceProductId:excludedProductId` plus globals. */
  listForProducts(scope: SignalScope, productIds: string[]): Promise<RecommendationExclusionProps[]>;
}
