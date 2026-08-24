/**
 * notification module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/NotificationRepository';
export * from './domain/errors/NotificationErrors';
