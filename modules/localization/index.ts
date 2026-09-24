/**
 * localization module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/LocalizationRepository';
export * from './domain/errors/LocalizationErrors';
export * from './domain/entities/Locale';

// Interface exports (routers, GraphQL)
export { localizationCustomerRouter } from './interface/routers/localizationCustomerRouter';
export { localizationMerchantRouter } from './interface/routers/localizationBusinessRouter';
export { localizationTypeDefs } from './interface/graphql/typeDefs';
export { localizationResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';

export { manifest } from './manifest';
