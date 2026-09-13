/**
 * checkout module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export { getCheckoutPorts, type CheckoutPorts } from './infrastructure/compositionRoot';
export * from './domain/repositories/CheckoutRepository';
export * from './domain/repositories/CheckoutConfigRepository';
export * from './domain/entities/CheckoutConfig';
export * from './domain/events/CheckoutEvents';
export * from './domain/errors/CheckoutErrors';

// Interface exports (routers, GraphQL)
export { checkoutCustomerRouter } from './interface/routers/checkoutRouter';
export { checkoutTypeDefs } from './interface/graphql/typeDefs';
export { checkoutResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
