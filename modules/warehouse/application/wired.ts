import warehouseDataRepository from '../infrastructure/repositories/WarehouseDataRepository';
import type { WarehouseUpdateParams } from '../infrastructure/repositories/WarehouseDataRepository';
import { ManageWarehouseAdminUseCase } from './useCases/ManageWarehouseAdmin';
import { ManageWarehouseAdminUseCaseV2 } from './useCases/ManageWarehouseAdminV2';

export { warehouseDataRepository, WarehouseUpdateParams };

export const manageWarehouseAdminUseCase = new ManageWarehouseAdminUseCase(warehouseDataRepository.warehouses);
export const manageWarehouseAdminUseCaseV2 = new ManageWarehouseAdminUseCaseV2(warehouseDataRepository.warehouses);
