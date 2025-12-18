/**
 * Inventory Repository Interface
 */

import { InventoryItem } from '../entities/InventoryItem';

export interface InventoryFilters {
  productId?: string;
  locationId?: string;
  sku?: string;
  isLowStock?: boolean;
  needsReorder?: boolean;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface InventoryRepository {
  findById(inventoryId: string): Promise<InventoryItem | null>;
  findByProductId(productId: string): Promise<InventoryItem[]>;
  findBySku(sku: string, locationId?: string): Promise<InventoryItem | null>;
  findByLocation(locationId: string, pagination?: PaginationOptions): Promise<PaginatedResult<InventoryItem>>;
  findAll(filters?: InventoryFilters, pagination?: PaginationOptions): Promise<PaginatedResult<InventoryItem>>;
  findLowStock(pagination?: PaginationOptions): Promise<PaginatedResult<InventoryItem>>;
  findNeedsReorder(pagination?: PaginationOptions): Promise<PaginatedResult<InventoryItem>>;
  save(item: InventoryItem): Promise<InventoryItem>;
  delete(inventoryId: string): Promise<void>;
  count(filters?: InventoryFilters): Promise<number>;

  // Transactions
  recordTransaction(transaction: {
    inventoryId: string;
    type: string;
    quantity: number;
    reference?: string;
    notes?: string;
    createdBy: string;
  }): Promise<void>;
  getTransactionHistory(inventoryId: string, limit?: number): Promise<Array<{
    transactionId: string;
    type: string;
    quantity: number;
    reference?: string;
    notes?: string;
    createdBy: string;
    createdAt: Date;
  }>>;

  // Reservations
  createReservation(reservation: {
    reservationId: string;
    inventoryId: string;
    quantity: number;
    orderId?: string;
    basketId?: string;
    expiresAt: Date;
  }): Promise<void>;
  releaseReservation(reservationId: string): Promise<void>;
  fulfillReservation(reservationId: string): Promise<void>;
  expireReservations(): Promise<number>;
}
