/**
 * inventory module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/InventoryRepository';
export * from './domain/repositories/StoreDispatchRepository';
export * from './domain/repositories/AdminInventoryRepository';
export * from './domain/errors/InventoryErrors';

// Interface exports (routers, GraphQL)
export { inventoryCustomerRouter } from './interface/routers/customerRouter';
export { inventoryBusinessRouter } from './interface/routers/businessRouter';
export { inventoryTypeDefs } from './interface/graphql/typeDefs';
export { inventoryResolvers } from './interface/graphql/resolvers';
export * from './interface/controllers';

// Domain entity exports
export { InventoryLocation, InventoryMovement, Inventory } from './domain/entities/Inventory';
export { AllocationRuleScope, AllocationStrategy, ReservationPolicy, InventoryAllocationRuleProps, AllocationEvaluationContext, AllocationRuleEvaluationResult, InventoryAllocationRule } from './domain/entities/InventoryAllocationRule';
export { InventoryItem, InventoryItemProps } from './domain/entities/InventoryItem';
export { DispatchStatus, StoreDispatchItemProps, StoreDispatchProps, StoreDispatch } from './domain/entities/StoreDispatch';
