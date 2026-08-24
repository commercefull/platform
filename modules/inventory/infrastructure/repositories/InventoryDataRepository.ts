/**
 * Consolidated Inventory Repository
 *
 * Merges InventoryRepository, inventoryRepo, adminInventoryRepo,
 * inventoryPoolRepo, inventoryReservationRepo, inventoryStockReservationRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Inventory (stock levels, items, pools, reservations, admin operations)
 */

import inventoryRepository from './InventoryRepository';
import inventoryRepo from './inventoryRepo';
import adminInventoryRepo from './adminInventoryRepo';
import inventoryPoolRepo from './inventoryPoolRepo';
import inventoryReservationRepo from './inventoryReservationRepo';
import inventoryStockReservationRepo from './inventoryStockReservationRepo';

class InventoryDataRepository {
  readonly items = inventoryRepository;
  readonly stock = inventoryRepo;
  readonly admin = adminInventoryRepo;
  readonly pools = inventoryPoolRepo;
  readonly reservations = inventoryReservationRepo;
  readonly stockReservations = inventoryStockReservationRepo;
}

export default new InventoryDataRepository();
