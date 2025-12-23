/**
 * Inventory Use Cases
 * 
 * Barrel export for all inventory-related use cases.
 */

// Legacy manage stock use cases
export * from './ManageStock';

// New granular use cases
export { ReserveStockUseCase, type ReserveStockInput, type ReserveStockOutput } from './ReserveStock';
export { ReleaseReservationUseCase, type ReleaseReservationInput, type ReleaseReservationOutput } from './ReleaseReservation';
export { TransferStockUseCase, type TransferStockInput, type TransferStockOutput } from './TransferStock';
export { AdjustStockUseCase as AdjustStockUseCaseV2, type AdjustStockInput as AdjustStockInputV2, type AdjustStockOutput } from './AdjustStock';

// Multi-store inventory pool use cases
export * from './CreateInventoryPool';
export * from './AllocateFromPool';
export * from './TransferBetweenStores';

// Inventory item management
export * from './CreateInventoryItem';
export * from './GetInventoryItem';
export * from './ListInventoryItems';
export * from './GetLowStockItems';
export * from './GetOutOfStockItems';
