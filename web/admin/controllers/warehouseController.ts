/**
 * Warehouse Controller
 * Handles warehouse management and fulfillment tracking for the Admin Hub
 */

import { Request, Response } from 'express';
import warehouseRepo from '../../../modules/warehouse/repos/warehouseRepo';
import { adminRespond } from 'web/respond';

// ============================================================================
// Warehouse Management
// ============================================================================

export const listWarehouses = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const warehouses = await warehouseRepo.findAll(activeOnly);
    const stats = await warehouseRepo.getStatistics();

    adminRespond(req, res, 'operations/warehouses/index', {
      pageName: 'Warehouses',
      warehouses,
      stats,
      filters: { activeOnly },
      pagination: { limit, offset },
      
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing warehouses:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load warehouses',
    });
  }
};

export const createWarehouseForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/warehouses/create', {
      pageName: 'Create Warehouse',
    });
  } catch (error: any) {
    console.error('Error loading create warehouse form:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
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
      processingTime
    } = req.body;

    const warehouse = await warehouseRepo.create({
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
      processingTime: processingTime ? parseInt(processingTime) : undefined
    });

    res.redirect(`/hub/warehouses/${warehouse.distributionWarehouseId}?success=Warehouse created successfully`);
  } catch (error: any) {
    console.error('Error creating warehouse:', error);

    adminRespond(req, res, 'operations/warehouses/create', {
      pageName: 'Create Warehouse',
      error: error.message || 'Failed to create warehouse',
      formData: req.body,
    });
  }
};

export const viewWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId } = req.params;

    const warehouse = await warehouseRepo.findById(warehouseId);

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
      
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing warehouse:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load warehouse',
    });
  }
};

export const editWarehouseForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId } = req.params;

    const warehouse = await warehouseRepo.findById(warehouseId);

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
  } catch (error: any) {
    console.error('Error loading edit warehouse form:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId } = req.params;
    const updates: any = {};

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
      processingTime
    } = req.body;

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

    const warehouse = await warehouseRepo.update(warehouseId, updates);

    if (!warehouse) {
      throw new Error('Warehouse not found after update');
    }

    res.redirect(`/hub/warehouses/${warehouseId}?success=Warehouse updated successfully`);
  } catch (error: any) {
    console.error('Error updating warehouse:', error);

    try {
      const warehouse = await warehouseRepo.findById(req.params.warehouseId);

      adminRespond(req, res, 'operations/warehouses/edit', {
        pageName: `Edit: ${warehouse?.name || 'Warehouse'}`,
        warehouse,
        error: error.message || 'Failed to update warehouse',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update warehouse',
      });
    }
  }
};

export const activateWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId } = req.params;

    const warehouse = await warehouseRepo.activate(warehouseId);

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    res.json({ success: true, message: 'Warehouse activated successfully' });
  } catch (error: any) {
    console.error('Error activating warehouse:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to activate warehouse' });
  }
};

export const deactivateWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId } = req.params;

    const warehouse = await warehouseRepo.deactivate(warehouseId);

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    res.json({ success: true, message: 'Warehouse deactivated successfully' });
  } catch (error: any) {
    console.error('Error deactivating warehouse:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate warehouse' });
  }
};

export const deleteWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { warehouseId } = req.params;

    const success = await warehouseRepo.delete(warehouseId);

    if (!success) {
      throw new Error('Failed to delete warehouse');
    }

    res.json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete warehouse' });
  }
};
