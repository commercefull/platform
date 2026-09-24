/**
 * support module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/SupportRepository';
export * from './domain/errors/SupportErrors';
export * from './domain/entities/SupportTicket';

// Interface exports (routers, GraphQL)
export { supportCustomerRouter } from './interface/routers/supportCustomerRouter';
export { supportBusinessRouter } from './interface/routers/supportBusinessRouter';
export { supportTypeDefs } from './interface/graphql/typeDefs';
export { supportResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';

export { manifest } from './manifest';
