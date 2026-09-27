/**
 * StaticRecommendationConfigAdapter — returns the defaults from
 * RecommendationConfigPort. Replace with a configuration-module-backed
 * adapter when per-merchant overrides (spec §10) are needed.
 */

import type { RecommendationConfig, RecommendationConfigPort } from '../../application/ports/RecommendationConfigPort';
import { DEFAULT_RECOMMENDATION_CONFIG } from '../../application/ports/RecommendationConfigPort';

export class StaticRecommendationConfigAdapter implements RecommendationConfigPort {
  async getConfig(): Promise<RecommendationConfig> {
    return { ...DEFAULT_RECOMMENDATION_CONFIG };
  }
}
