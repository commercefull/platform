/**
 * customer module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/CustomerRepository';
export * from './domain/events/CustomerEvents';
export * from './domain/errors/CustomerErrors';
