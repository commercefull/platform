/**
 * customer module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/CustomerRepository';
export * from './domain/events/CustomerEvents';
export * from './domain/errors/CustomerErrors';

// Interface exports (routers, GraphQL)
export { customerRouter } from './interface/routers/customerRouter';
export { customerBusinessRouter } from './interface/routers/businessRouter';
export { customerTypeDefs } from './interface/graphql/typeDefs';
export { customerResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
