/**
 * promotion module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/PromotionRepository';
export { Promotion as PromotionEntity } from './domain/entities/Promotion';
export * from './domain/errors/PromotionErrors';

// Interface exports (routers, GraphQL)
export { promotionCustomerRouter } from './interface/routers/customerRouter';
export { promotionBusinessRouter } from './interface/routers/businessRouter';
export { promotionTypeDefs } from './interface/graphql/typeDefs';
export { promotionResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';

export { manifest } from './manifest';
