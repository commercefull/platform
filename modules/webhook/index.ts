/**
 * webhook module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './domain/repositories/WebhookRepository';
export * from './domain/errors/WebhookErrors';

// Interface exports (routers, GraphQL)
export { webhookBusinessRouter } from './interface/routers/webhookBusinessRouter';
export { webhookTypeDefs } from './interface/graphql/typeDefs';
export { webhookResolvers } from './interface/graphql/resolvers';
export {
  listWebhookEndpoints,
  viewWebhookEndpoint,
  createWebhookForm,
  createWebhook,
  editWebhookForm,
  updateWebhook,
  deleteWebhook,
  viewWebhookDeliveries,
} from './interface/controllers/adminWebhookController';

export { manifest } from './manifest';
