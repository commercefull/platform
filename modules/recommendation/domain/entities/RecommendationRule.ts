/**
 * RecommendationRule — a merchant rule that links many products at once,
 * e.g. "products in category Cameras get top sellers in category Memory
 * Cards as accessories". Resolved nightly into `recommendationCandidate`
 * rows (source = 'rule'), so serving costs nothing extra.
 */

export type RuleSourceType = 'category' | 'brand' | 'collection' | 'productType' | 'tag';
export type RuleTargetType = 'category' | 'brand' | 'collection' | 'tag';
export type RuleTargetSort = 'bestSelling' | 'newest' | 'rating';
export type RulePriceBand = 'any' | 'cheaper' | 'similar' | 'pricier';

export const RULE_SOURCE_TYPES: RuleSourceType[] = ['category', 'brand', 'collection', 'productType', 'tag'];
export const RULE_TARGET_TYPES: RuleTargetType[] = ['category', 'brand', 'collection', 'tag'];
export const RULE_TARGET_SORTS: RuleTargetSort[] = ['bestSelling', 'newest', 'rating'];
export const RULE_PRICE_BANDS: RulePriceBand[] = ['any', 'cheaper', 'similar', 'pricier'];

export interface RecommendationRuleProps {
  recommendationRuleId: string;
  organizationId: string;
  storeId: string | null;
  name: string;
  sourceType: RuleSourceType;
  sourceId: string;
  targetType: RuleTargetType;
  targetId: string;
  relationType: string;
  targetSort: RuleTargetSort;
  priceBand: RulePriceBand;
  maxItems: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RecommendationRuleCreateProps = Omit<RecommendationRuleProps, 'recommendationRuleId' | 'createdAt' | 'updatedAt'>;
export type RecommendationRuleUpdateProps = Partial<Omit<RecommendationRuleCreateProps, 'organizationId'>>;

export class RecommendationRule {
  private constructor(private readonly props: RecommendationRuleProps) {}

  static reconstitute(props: RecommendationRuleProps): RecommendationRule {
    return new RecommendationRule(props);
  }

  get recommendationRuleId(): string {
    return this.props.recommendationRuleId;
  }
  get organizationId(): string {
    return this.props.organizationId;
  }
  get sourceType(): RuleSourceType {
    return this.props.sourceType;
  }
  get sourceId(): string {
    return this.props.sourceId;
  }
  get relationType(): string {
    return this.props.relationType;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  toJSON(): RecommendationRuleProps {
    return { ...this.props };
  }
}
