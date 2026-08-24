/**
 * inventory module public API.
 * Consumers must import from this root — never from infrastructure/.
 */

export * from './application/useCases';
export * from './domain/repositories/InventoryRepository';
export * from './domain/repositories/StoreDispatchRepository';
export * from './domain/errors/InventoryErrors';
