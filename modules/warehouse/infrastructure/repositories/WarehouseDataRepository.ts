/**
 * Consolidated Warehouse Repository
 *
 * Merges warehouseRepo, warehouseBinRepo, warehouseZoneRepo,
 * warehouseReceivingRepo, warehousePickPackRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Warehouse (warehouses, bins, zones, receiving, pick/pack operations)
 */

import warehouseRepo from './warehouseRepo';
import warehouseBinRepo from './warehouseBinRepo';
import warehouseZoneRepo from './warehouseZoneRepo';
import warehouseReceivingRepo from './warehouseReceivingRepo';
import warehousePickPackRepo from './warehousePickPackRepo';

// Re-export types for backward compatibility
export type { Warehouse, WarehouseCreateParams, WarehouseUpdateParams, WarehouseUpdateParams as WarehouseUpdateInput } from './warehouseRepo';

class WarehouseDataRepository {
  readonly warehouses = warehouseRepo;
  readonly bins = warehouseBinRepo;
  readonly zones = warehouseZoneRepo;
  readonly receiving = warehouseReceivingRepo;
  readonly pickPack = warehousePickPackRepo;
}

export default new WarehouseDataRepository();
