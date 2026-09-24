/**
 * analytics module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export { initializeAnalyticsHandlers } from './application/analyticsEventHandler';
export * from './domain/events/AnalyticsEvents';
export * from './domain/repositories/AnalyticsRepository';
export * from './domain/errors/AnalyticsErrors';

// Interface exports (routers, GraphQL)
export { analyticsBusinessRouter } from './interface/routers/analyticsBusinessRouter';
export { analyticsTypeDefs } from './interface/graphql/typeDefs';
export { analyticsResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';

export { manifest } from './manifest';
