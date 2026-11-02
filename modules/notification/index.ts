/**
 * notification module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/NotificationRepository';
export * from './domain/errors/NotificationErrors';

// Interface exports (routers, GraphQL)
export { notificationCustomerRouter } from './interface/routers/notificationCustomerRouter';
export { notificationMerchantRouter } from './interface/routers/notificationBusinessRouter';
export { notificationTypeDefs } from './interface/graphql/typeDefs';
export { notificationResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
