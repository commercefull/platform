/**
 * notification module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/NotificationRepository';
export * from './domain/repositories/NotificationCommandRepository';
export * from './domain/repositories/NotificationBatchRepository';
export * from './domain/repositories/NotificationDeliveryLogRepository';
export * from './domain/repositories/NotificationEventLogRepository';
export * from './domain/repositories/NotificationTemplateRepository';
export * from './domain/repositories/NotificationTemplateTranslationRepository';
export * from './domain/repositories/NotificationPreferenceRepository';
export * from './domain/repositories/NotificationUnsubscribeRepository';
export * from './domain/repositories/NotificationWebhookRepository';
export * from './domain/repositories/NotificationDeviceRepository';
export * from './domain/errors/NotificationErrors';

// Interface exports (routers, GraphQL)
export { notificationCustomerRouter } from './interface/routers/notificationCustomerRouter';
export { notificationMerchantRouter } from './interface/routers/notificationBusinessRouter';
export { notificationTypeDefs } from './interface/graphql/typeDefs';
export { notificationResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
