/**
 * gdpr module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/GdprRepository';
export * from './domain/errors/GdprErrors';

// Interface exports (routers, GraphQL)
export { gdprCustomerRouter } from './interface/routers/gdprCustomerRouter';
export { gdprBusinessRouter } from './interface/routers/gdprBusinessRouter';
export { gdprTypeDefs } from './interface/graphql/typeDefs';
export { gdprResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
