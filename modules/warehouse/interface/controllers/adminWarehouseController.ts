/**
 * Warehouse Controller
 * Handles warehouse management and fulfillment tracking for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageWarehouseAdminUseCaseV2 } from '../../application/useCases/ManageWarehouseAdminV2';
import { adminRespond } from '../../../../libs/adminRespond';
import { buildFormObject, FieldConfig } from '../../../../libs/formParsing';

const manageWarehouseUseCase = new ManageWarehouseAdminUseCaseV2();

// ============================================================================
// Warehouse Management
// ============================================================================

export const listWarehouses = async (req: TypedRequest, res: Response): Promise<void> => {
  const activeOnly = req.query.activeOnly !== 'false';
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const warehouses = await manageWarehouseUseCase.findAll(activeOnly);
  const stats = await manageWarehouseUseCase.getStatistics();

  adminRespond(req, res, 'operations/warehouses/index', {
    pageName: 'Warehouses',
    warehouses,
    stats,
    filters: { activeOnly },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
};

export const createWarehouseForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'operations/warehouses/create', {
    pageName: 'Create Warehouse',
  });
};

const warehouseCreateFields: FieldConfig[] = [
  { name: 'name' },
  { name: 'code' },
  { name: 'description', transform: 'stringOrUndefined' },
  { name: 'isActive', transform: 'boolTrue' },
  { name: 'isDefault', transform: 'boolTrue' },
  { name: 'isFulfillmentCenter', transform: 'boolTrue' },
  { name: 'isReturnCenter', transform: 'boolTrue' },
  { name: 'isVirtual', transform: 'boolTrue' },
  { name: 'addressLine1' },
  { name: 'addressLine2', transform: 'stringOrUndefined' },
  { name: 'city' },
  { name: 'state' },
  { name: 'postalCode' },
  { name: 'country' },
  { name: 'latitude', transform: 'float', falsyValue: undefined },
  { name: 'longitude', transform: 'float', falsyValue: undefined },
  { name: 'email', transform: 'stringOrUndefined' },
  { name: 'phone', transform: 'stringOrUndefined' },
  { name: 'contactName', transform: 'stringOrUndefined' },
  { name: 'timezone', transform: 'stringOrUndefined', default: 'UTC' },
  { name: 'cutoffTime', transform: 'stringOrUndefined' },
  { name: 'processingTime', transform: 'int', falsyValue: undefined },
];

function parseWarehouseCreateInput(body: RequestBody) {
  return buildFormObject(body as Record<string, unknown>, warehouseCreateFields);
}

export const createWarehouse = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const warehouse = await manageWarehouseUseCase.create(
      parseWarehouseCreateInput(req.body as RequestBody) as Parameters<typeof manageWarehouseUseCase.create>[0],
    );

    res.redirect(`/hub/warehouses/${warehouse.distributionWarehouseId}?success=Warehouse created successfully`);
  } catch (error: unknown) {
    logger.warning('Error:', error);

    adminRespond(req, res, 'operations/warehouses/create', {
      pageName: 'Create Warehouse',
      error: (error as Error).message || 'Failed to create warehouse',
      formData: req.body as RequestBody,
    });
  }
};

export const viewWarehouse = async (req: TypedRequest, res: Response): Promise<void> => {
  const { warehouseId } = req.params;

  const warehouse = await manageWarehouseUseCase.findById(warehouseId);

  if (!warehouse) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Warehouse not found',
    });
    return;
  }

  adminRespond(req, res, 'operations/warehouses/view', {
    pageName: `Warehouse: ${warehouse.name}`,
    warehouse,

    success: req.query.success || null,
  });
};

export const editWarehouseForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { warehouseId } = req.params;

  const warehouse = await manageWarehouseUseCase.findById(warehouseId);

  if (!warehouse) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Warehouse not found',
    });
    return;
  }

  adminRespond(req, res, 'operations/warehouses/edit', {
    pageName: `Edit: ${warehouse.name}`,
    warehouse,
  });
};

const warehouseUpdateFields: FieldConfig[] = [
  { name: 'name' },
  { name: 'description', transform: 'stringOrUndefined' },
  { name: 'isActive', transform: 'boolTrue' },
  { name: 'isDefault', transform: 'boolTrue' },
  { name: 'isFulfillmentCenter', transform: 'boolTrue' },
  { name: 'isReturnCenter', transform: 'boolTrue' },
  { name: 'isVirtual', transform: 'boolTrue' },
  { name: 'addressLine1' },
  { name: 'addressLine2', transform: 'stringOrUndefined' },
  { name: 'city' },
  { name: 'state' },
  { name: 'postalCode' },
  { name: 'country' },
  { name: 'latitude', transform: 'float', falsyValue: undefined },
  { name: 'longitude', transform: 'float', falsyValue: undefined },
  { name: 'email', transform: 'stringOrUndefined' },
  { name: 'phone', transform: 'stringOrUndefined' },
  { name: 'contactName', transform: 'stringOrUndefined' },
  { name: 'timezone' },
  { name: 'cutoffTime', transform: 'stringOrUndefined' },
  { name: 'processingTime', transform: 'int', falsyValue: undefined },
];

function parseWarehouseUpdates(body: RequestBody): Record<string, unknown> {
  return buildFormObject(body as Record<string, unknown>, warehouseUpdateFields);
}

export const updateWarehouse = async (req: TypedRequest, res: Response): Promise<void> => {
  const { warehouseId } = req.params;
  const updates = parseWarehouseUpdates(req.body as RequestBody);

  const warehouse = await manageWarehouseUseCase.update(warehouseId, updates);

  if (!warehouse) {
    throw new Error('Warehouse not found after update');
  }

  res.redirect(`/hub/warehouses/${warehouseId}?success=Warehouse updated successfully`);
};

export const activateWarehouse = async (req: TypedRequest, res: Response): Promise<void> => {
  const { warehouseId } = req.params;

  const warehouse = await manageWarehouseUseCase.activate(warehouseId);

  if (!warehouse) {
    throw new Error('Warehouse not found');
  }

  res.json({ success: true, message: 'Warehouse activated successfully' });
};

export const deactivateWarehouse = async (req: TypedRequest, res: Response): Promise<void> => {
  const { warehouseId } = req.params;

  const warehouse = await manageWarehouseUseCase.deactivate(warehouseId);

  if (!warehouse) {
    throw new Error('Warehouse not found');
  }

  res.json({ success: true, message: 'Warehouse deactivated successfully' });
};

export const deleteWarehouse = async (req: TypedRequest, res: Response): Promise<void> => {
  const { warehouseId } = req.params;

  const success = await manageWarehouseUseCase.delete(warehouseId);

  if (!success) {
    throw new Error('Failed to delete warehouse');
  }

  res.json({ success: true, message: 'Warehouse deleted successfully' });
};
