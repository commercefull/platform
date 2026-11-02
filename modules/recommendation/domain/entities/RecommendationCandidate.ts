/**
 * RecommendationCandidate — a scored (product → candidate) pair in the
 * serving read model (`recommendationCandidate` table), rebuilt nightly
 * from raw signals. Manual merchant links are NOT stored here — they are
 * resolved live from product's `productRelated` table and always outrank
 * computed candidates.
 */

export type CandidateSource = 'rule' | 'fbt' | 'similar' | 'coView';


/** Relation types a candidate can serve — mirrors product's ProductRelationType minus grouped/bundle. */
export type RecommendationRelationType = 'related' | 'accessory' | 'cross_sell' | 'up_sell';

/** Human-readable reason attached to a candidate ("Bought together in 42 orders"). */
export interface CandidateReason {
  /** Decayed co-occurrence/support count */
  support?: number;
  /** P(candidate | source) for fbt */
  confidence?: number;
  /** confidence / baseline popularity for fbt */
  lift?: number;
  /** Similarity score for similar candidates */
  similarityScore?: number;
  /** Rule id/name for rule candidates */
  ruleId?: string;
  ruleName?: string;
  /** Free-text fallback */
  label?: string;
}

export interface RecommendationCandidateProps {
  recommendationCandidateId: string;
  organizationId: string;
  storeId: string | null;
  productId: string;
  candidateProductId: string;
  source: CandidateSource;
  relationType: RecommendationRelationType;
  score: number;
  reason: CandidateReason | null;
  computedAt: Date;
  createdAt: Date;
}

export type RecommendationCandidateInsert = Omit<RecommendationCandidateProps, 'recommendationCandidateId' | 'createdAt'>;


