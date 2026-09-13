/**
 * shipping module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/ShippingRepository';
export * from './domain/errors/ShippingErrors';

// Interface exports (routers, GraphQL)
export { shippingCustomerRouter } from './interface/routers/shippingCustomerRouter';
export { shippingBusinessRouter } from './interface/routers/shippingBusinessRouter';
export { shippingTypeDefs } from './interface/graphql/typeDefs';
export { shippingResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
