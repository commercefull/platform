/**
 * content module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/ContentRepository';
export * from './domain/events/ContentEvents';
export * from './domain/errors/ContentErrors';

// Interface exports (routers, GraphQL)
export { contentCustomerRouter } from './interface/routers/contentCustomerRouter';
export { contentRouterAdmin } from './interface/routers/contentBusinessRouter';
export { contentTypeDefs } from './interface/graphql/typeDefs';
export { contentResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
export {
  userContactUsValidationRules,
  validateContactUs,
  userContactFormValidationRules,
  validateContactForm,
} from './validator';
