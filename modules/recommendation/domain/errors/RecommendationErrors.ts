/**
 * Recommendation domain errors — codes follow the module.error convention.
 */

import { AppError } from '../../../../libs/errors';

export class RecommendationError extends AppError {
  constructor(code: string, message: string, statusCode: number = 400) {
    super(message, statusCode, { code });
    this.name = 'RecommendationError';
  }
}

export class RecommendationRuleNotFoundError extends RecommendationError {
  constructor(ruleId: string) {
    super('recommendation.rule_not_found', `Recommendation rule not found: ${ruleId}`, 404);
  }
}

export class RecommendationExclusionNotFoundError extends RecommendationError {
  constructor(exclusionId: string) {
    super('recommendation.exclusion_not_found', `Recommendation exclusion not found: ${exclusionId}`, 404);
  }
}

export class RecommendationValidationError extends RecommendationError {
  constructor(message: string) {
    super('recommendation.validation_error', message, 400);
  }
}
