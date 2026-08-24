/**
 * product module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/ProductRepository';
export * from './domain/events/ProductEvents';
export * from './domain/errors/ProductErrors';
