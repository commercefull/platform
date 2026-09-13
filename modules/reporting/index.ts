/**
 * reporting module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './domain/repositories/ReportingRepository';
export * from './domain/errors/ReportingErrors';

// Interface exports (routers, GraphQL)
export { reportingBusinessRouter } from './interface/routers/reportingBusinessRouter';
export { reportingTypeDefs } from './interface/graphql/typeDefs';
export { reportingResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
