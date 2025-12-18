/**
 * Distribution Business Controller
 * Handles admin/merchant operations for warehouses (distribution centers)
 * Note: "Distribution Centers" in the API map to "Warehouses" in the database
 */
import { Request, Response } from 'express';
import * as warehouseRepo from '../repos/warehouseRepo';
import * as fulfillmentRepo from '../repos/fulfillmentRepo';
import { createWarehouse as createWarehouseUseCase } from '../useCases/warehouse/CreateWarehouse';
import { updateWarehouse as updateWarehouseUseCase } from '../useCases/warehouse/UpdateWarehouse';
import { deleteWarehouse as deleteWarehouseUseCase } from '../useCases/warehouse/DeleteWarehouse';
import { createDistributionRule as createDistributionRuleUseCase } from '../useCases/rules/CreateDistributionRule';
import { updateDistributionRule as updateDistributionRuleUseCase } from '../useCases/rules/UpdateDistributionRule';
import { deleteDistributionRule as deleteDistributionRuleUseCase } from '../useCases/rules/DeleteDistributionRule';

// =============================================================================
// Warehouses (Distribution Centers)
// =============================================================================

export const getDistributionCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, offset } = req.query;
    const result = await warehouseRepo.findAllWarehouses({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    res.status(200).json({
      success: true,
      data: result.warehouses,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching distribution centers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution centers'
    });
  }
};

export const getActiveDistributionCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouses = await warehouseRepo.findActiveWarehouses();
    res.status(200).json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    console.error('Error fetching active distribution centers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active distribution centers'
    });
  }
};

export const getDistributionCenterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouse = await warehouseRepo.findWarehouseById(req.params.id);

    if (!warehouse) {
      res.status(404).json({
        success: false,
        message: 'Distribution center not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    console.error('Error fetching distribution center:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution center'
    });
  }
};

export const getDistributionCenterByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouse = await warehouseRepo.findWarehouseByCode(req.params.code);

    if (!warehouse) {
      res.status(404).json({
        success: false,
        message: 'Distribution center not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    console.error('Error fetching distribution center by code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution center'
    });
  }
};

export const createDistributionCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createWarehouseUseCase.execute({
      ...req.body,
      isFulfillmentCenter: true,
      createdBy: (req as any).user?.id
    });

    if (!result.success) {
      const statusCode = result.error?.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: result.warehouse,
      message: 'Distribution center created successfully'
    });
  } catch (error) {
    console.error('Error creating distribution center:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create distribution center'
    });
  }
};

export const updateDistributionCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await updateWarehouseUseCase.execute({
      id,
      ...req.body
    });

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 
                         result.error?.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.warehouse,
      message: 'Distribution center updated successfully'
    });
  } catch (error) {
    console.error('Error updating distribution center:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update distribution center'
    });
  }
};

export const deleteDistributionCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await deleteWarehouseUseCase.execute({ id });

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Distribution center deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting distribution center:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete distribution center'
    });
  }
};

// =============================================================================
// Distribution Rules (re-exported from fulfillmentRepo for backward compatibility)
// =============================================================================

export const getDistributionRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = await fulfillmentRepo.findAllDistributionRules();
    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching distribution rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution rules'
    });
  }
};

export const getActiveDistributionRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = await fulfillmentRepo.findActiveDistributionRules();
    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching active distribution rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active distribution rules'
    });
  }
};

export const getDistributionRuleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await fulfillmentRepo.findDistributionRuleById(req.params.id);

    if (!rule) {
      res.status(404).json({
        success: false,
        message: 'Distribution rule not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching distribution rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution rule'
    });
  }
};

export const getDistributionRulesByZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = await fulfillmentRepo.findDistributionRulesByZone(req.params.zoneId);
    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching distribution rules by zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution rules'
    });
  }
};

export const getDefaultDistributionRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await fulfillmentRepo.findDefaultDistributionRule();

    if (!rule) {
      res.status(404).json({
        success: false,
        message: 'No default distribution rule found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching default distribution rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default distribution rule'
    });
  }
};

export const createDistributionRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createDistributionRuleUseCase.execute({
      ...req.body,
      createdBy: (req as any).user?.id
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: result.rule,
      message: 'Distribution rule created successfully'
    });
  } catch (error) {
    console.error('Error creating distribution rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create distribution rule'
    });
  }
};

export const updateDistributionRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await updateDistributionRuleUseCase.execute({
      id,
      ...req.body
    });

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rule,
      message: 'Distribution rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating distribution rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update distribution rule'
    });
  }
};

export const deleteDistributionRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await deleteDistributionRuleUseCase.execute({ id });

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Distribution rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting distribution rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete distribution rule'
    });
  }
};
