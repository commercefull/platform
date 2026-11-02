/**
 * Inventory Use Cases
 *
 * Barrel export for all inventory-related use cases.
 */

// New granular use cases

// Multi-store inventory pool use cases
export * from './CreateInventoryPool';
export * from './AllocateFromPool';
export * from './TransferBetweenStores';
export * from './CreateStoreDispatch';
export * from './ListStoreDispatches';
export * from './GetStoreDispatch';
export * from './ApproveStoreDispatch';
export * from './DispatchFromStore';
export * from './ReceiveStoreDispatch';
export * from './CancelStoreDispatch';

// Reservation management
export * from './ConfirmReservation';

// Threshold management
export * from './SetLowStockThreshold';

// Inventory item management
export * from './CreateInventoryItem';
export * from './GetInventoryItem';
export * from './ListInventoryItems';
export * from './GetLowStockItems';
export * from './GetOutOfStockItems';
