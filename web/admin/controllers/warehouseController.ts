/**
 * Warehouse Controller
 * Handles warehouse management and fulfillment tracking for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageWarehouseAdminUseCaseV2 } from '../../../modules/warehouse/application/useCases/ManageWarehouseAdminV2';
import { adminRespond } from '../../respond';

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

export const createWarehouse = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const {
      name,
      code,
      description,
      isActive,
      isDefault,
      isFulfillmentCenter,
      isReturnCenter,
      isVirtual,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      latitude,
      longitude,
      email,
      phone,
      contactName,
      timezone,
      cutoffTime,
      processingTime,
    } = body;

    const warehouse = await manageWarehouseUseCase.create({
      name,
      code,
      description: description || undefined,
      isActive: isActive === 'true',
      isDefault: isDefault === 'true',
      isFulfillmentCenter: isFulfillmentCenter === 'true',
      isReturnCenter: isReturnCenter === 'true',
      isVirtual: isVirtual === 'true',
      addressLine1,
      addressLine2: addressLine2 || undefined,
      city,
      state,
      postalCode,
      country,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      email: email || undefined,
      phone: phone || undefined,
      contactName: contactName || undefined,
      timezone: timezone || 'UTC',
      cutoffTime: cutoffTime || undefined,
      processingTime: processingTime ? parseInt(processingTime) : undefined,
    });

    res.redirect(`/hub/warehouses/${warehouse.distributionWarehouseId}?success=Warehouse created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

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

export const updateWarehouse = async (req: TypedRequest, res: Response): Promise<void> => {
  const { warehouseId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
  const {
    name,
    description,
    isActive,
    isDefault,
    isFulfillmentCenter,
    isReturnCenter,
    isVirtual,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    latitude,
    longitude,
    email,
    phone,
    contactName,
    timezone,
    cutoffTime,
    processingTime,
  } = body;

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description || undefined;
  if (isActive !== undefined) updates.isActive = isActive === 'true';
  if (isDefault !== undefined) updates.isDefault = isDefault === 'true';
  if (isFulfillmentCenter !== undefined) updates.isFulfillmentCenter = isFulfillmentCenter === 'true';
  if (isReturnCenter !== undefined) updates.isReturnCenter = isReturnCenter === 'true';
  if (isVirtual !== undefined) updates.isVirtual = isVirtual === 'true';
  if (addressLine1 !== undefined) updates.addressLine1 = addressLine1;
  if (addressLine2 !== undefined) updates.addressLine2 = addressLine2 || undefined;
  if (city !== undefined) updates.city = city;
  if (state !== undefined) updates.state = state;
  if (postalCode !== undefined) updates.postalCode = postalCode;
  if (country !== undefined) updates.country = country;
  if (latitude !== undefined) updates.latitude = latitude ? parseFloat(latitude) : undefined;
  if (longitude !== undefined) updates.longitude = longitude ? parseFloat(longitude) : undefined;
  if (email !== undefined) updates.email = email || undefined;
  if (phone !== undefined) updates.phone = phone || undefined;
  if (contactName !== undefined) updates.contactName = contactName || undefined;
  if (timezone !== undefined) updates.timezone = timezone;
  if (cutoffTime !== undefined) updates.cutoffTime = cutoffTime || undefined;
  if (processingTime !== undefined) updates.processingTime = processingTime ? parseInt(processingTime) : undefined;

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
