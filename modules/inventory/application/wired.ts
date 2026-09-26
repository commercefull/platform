import inventoryDataRepository from '../infrastructure/repositories/InventoryDataRepository';
import storeDispatchRepository from '../infrastructure/repositories/StoreDispatchAggregateRepository';
import { StorePickupLocationAdapter } from '../infrastructure/acl/StorePickupLocationAdapter';
import { inventoryAllocationRuleRepo } from '../infrastructure';
import { AdjustStockUseCase } from './useCases/AdjustStock';
import { ReserveLocationStockUseCase } from './useCases/ReserveLocationStock';
import { ReleaseLocationReservationUseCase } from './useCases/ReleaseLocationReservation';
import { ManageInventoryLocationsUseCase } from './useCases/ManageInventoryLocations';
import { TransferStockUseCase } from './useCases/TransferStock';
import { CreateInventoryItemUseCase } from './useCases/CreateInventoryItem';
import { CreateInventoryPoolUseCase } from './useCases/CreateInventoryPool';
import { AllocateFromPoolUseCase } from './useCases/AllocateFromPool';
import { GetInventoryItemUseCase } from './useCases/GetInventoryItem';
import { ListInventoryItemsUseCase } from './useCases/ListInventoryItems';
import { TransferBetweenStoresUseCase } from './useCases/TransferBetweenStores';
import { ConfirmReservationUseCase } from './useCases/ConfirmReservation';
import { SetLowStockThresholdUseCase } from './useCases/SetLowStockThreshold';
import { GetLowStockItemsUseCase } from './useCases/GetLowStockItems';
import { GetOutOfStockItemsUseCase } from './useCases/GetOutOfStockItems';
import { ReserveStockUseCase } from './useCases/ReserveStock';
import * as pickupLocationRepo from '../../store/infrastructure/repositories/pickupLocationRepo';

export const pickupLocationAdapter = new StorePickupLocationAdapter(pickupLocationRepo);
export const adjustStockUseCase = new AdjustStockUseCase(inventoryDataRepository.stock);
export const reserveLocationStockUseCase = new ReserveLocationStockUseCase(inventoryDataRepository.stock);
export const releaseLocationReservationUseCase = new ReleaseLocationReservationUseCase(inventoryDataRepository.stock);
export const manageInventoryLocationsUseCase = new ManageInventoryLocationsUseCase(inventoryDataRepository.stock);
export const transferStockUseCase = new TransferStockUseCase(inventoryDataRepository.items);
export const createInventoryItemUseCase = new CreateInventoryItemUseCase(inventoryDataRepository.items);
export const createInventoryPoolUseCase = new CreateInventoryPoolUseCase(inventoryDataRepository.pools);
export const allocateFromPoolUseCase = new AllocateFromPoolUseCase(inventoryDataRepository.pools);
export const getInventoryItemUseCase = new GetInventoryItemUseCase(inventoryDataRepository.items);
export const listInventoryItemsUseCase = new ListInventoryItemsUseCase(inventoryDataRepository.items);
export const transferBetweenStoresUseCase = new TransferBetweenStoresUseCase(inventoryDataRepository.items);
export const confirmReservationUseCase = new ConfirmReservationUseCase(inventoryDataRepository.stock);
export const setLowStockThresholdUseCase = new SetLowStockThresholdUseCase(inventoryDataRepository.items);
const paginate = <T>(rows: T[], page: number, limit: number): T[] => rows.slice((page - 1) * limit, page * limit);

const lowStockItemsAdapter = {
  findLowStock: async (options: { warehouseId?: string; threshold?: number; page: number; limit: number }) => {
    let locations = await inventoryDataRepository.stock.findLowStockLocations();
    if (options.warehouseId) {
      locations = locations.filter(l => l.distributionWarehouseId === options.warehouseId);
    }
    if (options.threshold !== undefined) {
      const threshold = options.threshold;
      locations = locations.filter(l => l.quantity <= threshold);
    }
    return paginate(locations, options.page, options.limit).map(l => ({
      inventoryItemId: l.inventoryLocationId,
      productId: l.productId,
      variantId: l.productVariantId ?? undefined,
      warehouseId: l.distributionWarehouseId,
      sku: l.sku,
      quantity: l.quantity,
      reservedQuantity: l.reservedQuantity,
      reorderPoint: l.minimumStockLevel ?? 0,
      reorderQuantity: l.maximumStockLevel ?? 0,
    }));
  },
};

const outOfStockItemsAdapter = {
  findOutOfStock: async (options: { warehouseId?: string; includeReserved: boolean; page: number; limit: number }) => {
    let locations = await inventoryDataRepository.stock.findOutOfStockLocations();
    if (options.warehouseId) {
      locations = locations.filter(l => l.distributionWarehouseId === options.warehouseId);
    }
    return paginate(locations, options.page, options.limit).map(l => ({
      inventoryItemId: l.inventoryLocationId,
      productId: l.productId,
      variantId: l.productVariantId ?? undefined,
      warehouseId: l.distributionWarehouseId,
      sku: l.sku,
      reservedQuantity: l.reservedQuantity,
      reorderQuantity: l.maximumStockLevel ?? 0,
      lastStockedAt: l.receivedDate ? new Date(l.receivedDate).toISOString() : undefined,
    }));
  },
};

const reserveStockAdapter = {
  findByProduct: async (productId: string, variantId: string | undefined, locationId: string | undefined) => {
    const item = locationId
      ? await inventoryDataRepository.items.findByProduct(productId, variantId, locationId)
      : (await inventoryDataRepository.items.findAll({ productId }, { limit: 50, offset: 0 })).data.find(
          i => i.variantId === variantId,
        );
    if (!item) return null;
    return {
      inventoryItemId: item.inventoryId,
      quantity: item.quantity,
      reservedQuantity: item.reservedQuantity,
    };
  },
  createReservation: (input: {
    reservationId: string;
    orderId: string;
    inventoryItemId: string;
    productId: string;
    variantId?: string;
    sku?: string;
    quantity: number;
    locationId?: string;
    expiresAt: Date;
    status: string;
  }) => inventoryDataRepository.stock.createReservation(input),
  updateReservedQuantity: async (inventoryItemId: string, newReservedQuantity: number) => {
    await inventoryDataRepository.stock.updateLocation(inventoryItemId, { reservedQuantity: newReservedQuantity });
  },
};

export const getLowStockItemsUseCase = new GetLowStockItemsUseCase(lowStockItemsAdapter);
export const getOutOfStockItemsUseCase = new GetOutOfStockItemsUseCase(outOfStockItemsAdapter);
export const reserveStockUseCase = new ReserveStockUseCase(reserveStockAdapter);

export { inventoryDataRepository, storeDispatchRepository };

import { ManageAllocationRulesUseCase } from './useCases/ManageAllocationRules';

export const manageAllocationRulesUseCase = new ManageAllocationRulesUseCase(inventoryAllocationRuleRepo);
