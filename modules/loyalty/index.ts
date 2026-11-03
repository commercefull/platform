/**
 * loyalty module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/LoyaltyTierRepository';
export * from './domain/repositories/LoyaltyPointsRepository';
export * from './domain/repositories/LoyaltyTransactionRepository';
export * from './domain/repositories/LoyaltyRewardRepository';
export * from './domain/repositories/StorefrontLoyaltyRepository';
export * from './domain/errors/LoyaltyErrors';

// Interface exports (routers, GraphQL)
export { loyaltyCustomerRouter } from './interface/routers/loyaltyCustomerRouter';
export { loyaltyMerchantRouter } from './interface/routers/loyaltyBusinessRouter';
export { loyaltyTypeDefs } from './interface/graphql/typeDefs';
export { loyaltyResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
