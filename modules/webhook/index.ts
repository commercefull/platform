/**
 * webhook module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './domain/repositories/WebhookRepository';
export * from './domain/errors/WebhookErrors';
