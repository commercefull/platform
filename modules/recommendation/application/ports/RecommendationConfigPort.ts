/**
 * RecommendationConfigPort — per-organization thresholds and placement
 * overrides (spec §10). The default adapter reads the configuration module
 * when enabled and falls back to these constants.
 */

export interface RecommendationConfig {
  fbtMinSupport: number;
  fbtMinLift: number;
  fbtMaxItemsPerOrder: number;
  decayHalfLifeDays: number;
  candidatesTopN: number;
  similarMinScore: number;
  similarPriceBandPct: number;
  coViewEnabled: boolean;
  hideOutOfStock: boolean;
  cacheTtlSeconds: number;
}

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  fbtMinSupport: 3,
  fbtMinLift: 1.0,
  fbtMaxItemsPerOrder: 20,
  decayHalfLifeDays: 90,
  candidatesTopN: 20,
  similarMinScore: 5,
  similarPriceBandPct: 25,
  coViewEnabled: false,
  hideOutOfStock: true,
  cacheTtlSeconds: 900,
};

export interface RecommendationConfigPort {
  getConfig(organizationId?: string, storeId?: string): Promise<RecommendationConfig>;
}
