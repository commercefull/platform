import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import WarehouseRepo from '../repos/warehouseRepo';
import { successResponse, errorResponse, validationErrorResponse } from '../../../libs/apiResponse';

const warehouseRepo = WarehouseRepo;

export const getWarehouses = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      activeOnly = 'true',
      fulfillmentCenters,
      returnCenters,
      merchantId,
      country,
      search,
      limit = '50',
      offset = '0'
    } = req.query;

    let warehouses;

    if (search) {
      // Use search functionality
      warehouses = await warehouseRepo.search(search as string);
    } else if (fulfillmentCenters === 'true') {
      // Get fulfillment centers
      warehouses = await warehouseRepo.findFulfillmentCenters();
    } else if (returnCenters === 'true') {
      // Get return centers
      warehouses = await warehouseRepo.findReturnCenters();
    } else if (merchantId) {
      // Get warehouses by merchant
      warehouses = await warehouseRepo.findByMerchantId(merchantId as string);
    } else if (country) {
      // Get warehouses by country
      warehouses = await warehouseRepo.findByCountry(country as string);
    } else {
      // Get all warehouses
      warehouses = await warehouseRepo.findAll(activeOnly === 'true');
    }

    successResponse(res, warehouses);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch warehouses');
  }
};

export const getWarehouseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const warehouse = await warehouseRepo.findById(id);

    if (!warehouse) {
      errorResponse(res, `Warehouse with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, warehouse);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch warehouse');
  }
};

export const getWarehouseByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const warehouse = await warehouseRepo.findByCode(code);

    if (!warehouse) {
      errorResponse(res, `Warehouse with code ${code} not found`, 404);
      return;
    }

    successResponse(res, warehouse);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch warehouse');
  }
};

export const getDefaultWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouse = await warehouseRepo.findDefault();

    if (!warehouse) {
      errorResponse(res, 'No default warehouse found', 404);
      return;
    }

    successResponse(res, warehouse);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch default warehouse');
  }
};

export const getFulfillmentCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouses = await warehouseRepo.findFulfillmentCenters();
    successResponse(res, warehouses);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch fulfillment centers');
  }
};

export const getReturnCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouses = await warehouseRepo.findReturnCenters();
    successResponse(res, warehouses);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch return centers');
  }
};

export const getWarehouseStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const statistics = await warehouseRepo.getStatistics();
    successResponse(res, statistics);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch warehouse statistics');
  }
};

export const findNearestWarehouses = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      latitude,
      longitude,
      radiusKm = '100',
      limit = '10'
    } = req.query;

    if (!latitude || !longitude) {
      validationErrorResponse(res, ['latitude and longitude are required']);
      return;
    }

    const warehouses = await warehouseRepo.findNearLocation(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      parseFloat(radiusKm as string),
      parseInt(limit as string)
    );

    successResponse(res, warehouses);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to find nearest warehouses');
  }
};

export const getWarehousesByCountry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { country } = req.params;
    const warehouses = await warehouseRepo.findByCountry(country);
    successResponse(res, warehouses);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch warehouses');
  }
};

export const getWarehousesByMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const warehouses = await warehouseRepo.findByMerchantId(merchantId);
    successResponse(res, warehouses);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to fetch warehouses');
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
      merchantId,
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
      operatingHours,
      capabilities,
      shippingMethods,
      createdBy
    } = req.body;

    // Validate required fields
    const errors: string[] = [];
    if (!name) errors.push('name is required');
    if (!code) errors.push('code is required');
    if (!addressLine1) errors.push('addressLine1 is required');
    if (!city) errors.push('city is required');
    if (!state) errors.push('state is required');
    if (!postalCode) errors.push('postalCode is required');
    if (!country) errors.push('country is required');

    if (errors.length > 0) {
      validationErrorResponse(res, errors);
      return;
    }

    const warehouseParams = {
      name,
      code,
      description,
      isActive,
      isDefault,
      isFulfillmentCenter,
      isReturnCenter,
      isVirtual,
      merchantId,
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
      operatingHours,
      capabilities,
      shippingMethods,
      createdBy
    };

    const warehouse = await warehouseRepo.create(warehouseParams);
    successResponse(res, warehouse, 201);
  } catch (error: any) {
    logger.error('Error:', error);
    
    if (error.message.includes('already exists')) {
      errorResponse(res, error.message, 409);
    } else {
      errorResponse(res, 'Failed to create warehouse');
    }
  }
};

export const updateWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateParams = req.body;

    const warehouse = await warehouseRepo.update(id, updateParams);

    if (!warehouse) {
      errorResponse(res, `Warehouse with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, warehouse);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to update warehouse');
  }
};

export const deleteWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await warehouseRepo.delete(id);

    if (!deleted) {
      errorResponse(res, `Warehouse with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, { message: 'Warehouse deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to delete warehouse');
  }
};

export const setDefaultWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const warehouse = await warehouseRepo.setAsDefault(id);

    if (!warehouse) {
      errorResponse(res, `Warehouse with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, warehouse);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to set default warehouse');
  }
};

export const activateWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const warehouse = await warehouseRepo.activate(id);

    if (!warehouse) {
      errorResponse(res, `Warehouse with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, warehouse);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to activate warehouse');
  }
};

export const deactivateWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const warehouse = await warehouseRepo.deactivate(id);

    if (!warehouse) {
      errorResponse(res, `Warehouse with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, warehouse);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to deactivate warehouse');
  }
};

export const addShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { method } = req.body;

    if (!method) {
      validationErrorResponse(res, ['method is required']);
      return;
    }

    const warehouse = await warehouseRepo.addShippingMethod(id, method);

    if (!warehouse) {
      errorResponse(res, `Warehouse with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, warehouse);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to add shipping method');
  }
};

export const removeShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, method } = req.params;

    const warehouse = await warehouseRepo.removeShippingMethod(id, method);

    if (!warehouse) {
      errorResponse(res, `Warehouse with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, warehouse);
  } catch (error: any) {
    logger.error('Error:', error);
    
    errorResponse(res, 'Failed to remove shipping method');
  }
};
