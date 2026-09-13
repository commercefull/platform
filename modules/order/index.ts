/**
 * order module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/OrderRepository';
export * from './domain/repositories/OrderQueryRepository';
export * from './domain/repositories/OrderFulfillmentRepository';
export * from './domain/repositories/OrderFulfillmentPackageRepository';
export * from './domain/repositories/OrderReturnRepository';
export * from './domain/events/OrderEvents';
export * from './domain/services/OrderRouter';
export * from './domain/errors/OrderErrors';

// Interface exports (routers, GraphQL)
export { orderCustomerRouter } from './interface/routers/customerRouter';
export { orderBusinessRouter } from './interface/routers/businessRouter';
export { orderTypeDefs } from './interface/graphql/typeDefs';
export { orderResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
