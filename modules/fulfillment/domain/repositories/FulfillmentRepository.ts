/**
 * Fulfillment Repository Interface
 *
 * Defines the contract for Fulfillment persistence operations.
 */

import { Fulfillment, FulfillmentStatus, SourceType } from '../entities/Fulfillment';
import { FulfillmentItem } from '../entities/FulfillmentItem';

export interface FulfillmentFilters {
  orderId?: string;
  status?: FulfillmentStatus | FulfillmentStatus[];
  sourceType?: SourceType;
  sourceId?: string;
  merchantId?: string;
  supplierId?: string;
  storeId?: string;
  channelId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IFulfillmentRepository {
  // Fulfillment operations
  save(fulfillment: Fulfillment): Promise<Fulfillment>;
  findById(fulfillmentId: string): Promise<Fulfillment | null>;
  findByOrderId(orderId: string): Promise<Fulfillment[]>;
  findAll(filters?: FulfillmentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Fulfillment>>;
  findByTrackingNumber(trackingNumber: string): Promise<Fulfillment | null>;
  delete(fulfillmentId: string): Promise<boolean>;

  // Fulfillment Item operations
  saveItem(item: FulfillmentItem): Promise<FulfillmentItem>;
  saveItems(items: FulfillmentItem[]): Promise<FulfillmentItem[]>;
  findItemsByFulfillmentId(fulfillmentId: string): Promise<FulfillmentItem[]>;
  findItem(fulfillmentItemId: string): Promise<FulfillmentItem | null>;
  deleteItem(fulfillmentItemId: string): Promise<boolean>;

  // Batch operations
  updateStatus(fulfillmentId: string, status: FulfillmentStatus): Promise<boolean>;
  bulkUpdateStatus(fulfillmentIds: string[], status: FulfillmentStatus): Promise<number>;
}
