/**
 * warehouse module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/WarehouseRepository';
export * from './domain/errors/WarehouseErrors';

// Interface exports (routers, GraphQL)
export { warehouseCustomerRouter } from './interface/routers/warehouseCustomerRouter';
export { warehouseMerchantRouter } from './interface/routers/warehouseBusinessRouter';
export { warehouseTypeDefs } from './interface/graphql/typeDefs';
export { warehouseResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';

export { manifest } from './manifest';
