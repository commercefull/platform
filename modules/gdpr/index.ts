/**
 * gdpr module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/GdprRepository';
export * from './domain/errors/GdprErrors';
