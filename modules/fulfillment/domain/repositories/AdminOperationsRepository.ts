export interface OperationsStats {
  pendingFulfillments: number;
  activeWarehouses: number;
  abandonedCarts: number;
  lowStockItems: number;
  totalSuppliers: number;
  activeSuppliers: number;
}

export interface IAdminOperationsRepository {
  getOperationsStats(): Promise<OperationsStats>;
  findRecentFulfillments(limit?: number): Promise<unknown[]>;
  findWarehousesWithCounts(): Promise<unknown[]>;
}
