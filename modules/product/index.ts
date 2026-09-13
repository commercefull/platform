/**
 * product module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/ProductRepository';
export * from './domain/events/ProductEvents';
export * from './domain/errors/ProductErrors';
export * from './domain/entities/ProductType';
export * from './domain/entities/ProductAttribute';
export * from './domain/entities/Brand';

// Interface exports (routers, GraphQL)
export { productCustomerRouter } from './interface/routers/productCustomerRouter';
export { productBusinessRouter } from './interface/routers/productBusinessRouter';
export { attributeBusinessRouter } from './interface/routers/attributeRouter';
export { categoryCustomerRouter } from './interface/routers/categoryCustomerRouter';
export { productTypeDefs } from './interface/graphql/typeDefs';
export { productResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';
