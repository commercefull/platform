/**
 * pricing module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/errors/PricingErrors';
export * from './domain/pricingRule';
export * from './domain/currency';
export * from './domain/catalogPrice';
export * from './domain/services/PricingRuleEvaluator';
export * from './domain/repositories/CurrencyCatalog';
export * from './domain/repositories/PricingRuleQueryRepository';
export * from './domain/repositories/PricingDataQueryRepository';

// Interface exports (routers, GraphQL)
export { pricingMerchantRouter } from './interface/routers/pricingBusinessRouter';
export { pricingTypeDefs } from './interface/graphql/typeDefs';
export { pricingResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';

export { manifest } from './manifest';
