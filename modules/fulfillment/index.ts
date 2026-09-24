/**
 * fulfillment module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/FulfillmentRepository';
export * from './domain/events/FulfillmentEvents';
export * from './domain/errors/FulfillmentErrors';

// Interface exports (routers, GraphQL)
export { default as fulfillmentCustomerRouter } from './interface/routers/fulfillmentCustomerRouter';
export { fulfillmentBusinessRouter } from './interface/routers/fulfillmentBusinessRouter';
export { fulfillmentLocationRouter } from './interface/routers/fulfillmentLocationRouter';
export { fulfillmentTypeDefs } from './interface/graphql/typeDefs';
export { fulfillmentResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';

export { manifest } from './manifest';
