/**
 * Events published by the recommendation module.
 * Consumed events are declared in manifest.ts and handled in
 * application/eventHandlers.ts.
 */

export const RECOMMENDATION_EVENTS = {
  REBUILT: 'recommendation.rebuilt',
  RULE_CREATED: 'recommendation.rule_created',
  RULE_UPDATED: 'recommendation.rule_updated',
  RULE_DELETED: 'recommendation.rule_deleted',
} as const;

export interface RecommendationRebuiltPayload {
  organizationId: string;
  storeId?: string | null;
  candidatesWritten: number;
  durationMs: number;
}
