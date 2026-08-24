/**
 * analytics module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/events/AnalyticsEvents';
export * from './domain/repositories/AnalyticsRepository';
export * from './domain/errors/AnalyticsErrors';
