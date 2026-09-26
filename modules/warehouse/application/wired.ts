import warehouseDataRepository from '../infrastructure/repositories/WarehouseDataRepository';
import type { WarehouseUpdateParams } from '../infrastructure/repositories/WarehouseDataRepository';
import { ManageWarehouseAdminUseCase } from './useCases/ManageWarehouseAdmin';
import { ManageWarehouseAdminUseCaseV2 } from './useCases/ManageWarehouseAdminV2';
import { ManageZonesUseCase } from './useCases/ManageZones';
import { ManageBinsUseCase } from './useCases/ManageBins';
import { ManageReceivingUseCase } from './useCases/ManageReceiving';
import { ManagePickPackUseCase } from './useCases/ManagePickPack';

export { warehouseDataRepository, WarehouseUpdateParams };

export const manageWarehouseAdminUseCase = new ManageWarehouseAdminUseCase(warehouseDataRepository.warehouses);
export const manageWarehouseAdminUseCaseV2 = new ManageWarehouseAdminUseCaseV2(warehouseDataRepository.warehouses);

export const manageZonesUseCase = new ManageZonesUseCase(warehouseDataRepository.zones);
export const manageBinsUseCase = new ManageBinsUseCase(warehouseDataRepository.bins);
export const manageReceivingUseCase = new ManageReceivingUseCase(warehouseDataRepository.receiving);
export const managePickPackUseCase = new ManagePickPackUseCase(warehouseDataRepository.pickPack);

import { GetWarehouseUseCase } from './useCases/GetWarehouse';
import { ListWarehousesUseCase } from './useCases/ListWarehouses';
import { CreateWarehouseUseCase } from './useCases/CreateWarehouse';

export const getWarehouseUseCase = new GetWarehouseUseCase(warehouseDataRepository.warehouses);
export const listWarehousesUseCase = new ListWarehousesUseCase(warehouseDataRepository.warehouses);
export const createWarehouseUseCase = new CreateWarehouseUseCase(warehouseDataRepository.warehouses);
