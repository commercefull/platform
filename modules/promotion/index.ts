/**
 * promotion module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/PromotionRepository';
export * from './domain/errors/PromotionErrors';
