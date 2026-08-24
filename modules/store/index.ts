/**
 * store module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/StoreRepository';
export * from './domain/events/StoreEvents';
export * from './domain/errors/StoreErrors';
