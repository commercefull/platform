/**
 * Shipping Controller
 * Handles shipping management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import shippingMethodRepo from '../../../modules/shipping/repos/shippingMethodRepo';
import { adminRespond } from 'web/respond';

// ============================================================================
// Shipping Methods
// ============================================================================

export const listShippingMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const methods = await shippingMethodRepo.findAll();

    adminRespond(req, res, 'shipping/methods/index', {
      pageName: 'Shipping Methods',
      methods,
      
      success: req.query.success || null
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load shipping methods',
    });
  }
};

export const createShippingMethodForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'shipping/methods/create', {
      pageName: 'Create Shipping Method',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      code,
      description,
      isActive,
      isDefault,
      serviceCode,
      domesticInternational,
      estimatedDeliveryDays,
      handlingDays,
      priority,
      displayOnFrontend,
      allowFreeShipping,
      minWeight,
      maxWeight,
      minOrderValue,
      maxOrderValue,
      shippingClass
    } = req.body;

    const method = await shippingMethodRepo.create({
      shippingCarrierId: null,
      name,
      code,
      description: description || undefined,
      isActive: isActive === 'true' || isActive === true,
      isDefault: isDefault === 'true' || isDefault === true,
      serviceCode: serviceCode || undefined,
      domesticInternational: domesticInternational || 'both',
      estimatedDeliveryDays: estimatedDeliveryDays ? JSON.parse(estimatedDeliveryDays) : undefined,
      handlingDays: handlingDays ? parseInt(handlingDays) : 1,
      priority: priority ? parseInt(priority) : 0,
      displayOnFrontend: displayOnFrontend !== 'false' && displayOnFrontend !== false,
      allowFreeShipping: allowFreeShipping !== 'false' && allowFreeShipping !== false,
      minWeight: minWeight ? parseFloat(minWeight).toString() : null,
      maxWeight: maxWeight ? parseFloat(maxWeight).toString() : null,
      minOrderValue: minOrderValue ? parseFloat(minOrderValue).toString() : null,
      maxOrderValue: maxOrderValue ? parseFloat(maxOrderValue).toString() : null,
      dimensionRestrictions: undefined,
      shippingClass: shippingClass || undefined,
      customFields: undefined,
      createdBy: null
    });

    res.redirect(`/hub/shipping/methods/${method.shippingMethodId}?success=Shipping method created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    

    adminRespond(req, res, 'shipping/methods/create', {
      pageName: 'Create Shipping Method',
      error: error.message || 'Failed to create shipping method',
      formData: req.body,
    });
  }
};

export const viewShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { methodId } = req.params;

    const method = await shippingMethodRepo.findById(methodId);

    if (!method) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Shipping method not found',
      });
      return;
    }

    adminRespond(req, res, 'shipping/methods/view', {
      pageName: `Method: ${method.name}`,
      method,
      
      success: req.query.success || null
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load shipping method',
    });
  }
};

export const editShippingMethodForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { methodId } = req.params;

    const method = await shippingMethodRepo.findById(methodId);

    if (!method) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Shipping method not found',
      });
      return;
    }

    adminRespond(req, res, 'shipping/methods/edit', {
      pageName: `Edit: ${method.name}`,
      method,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { methodId } = req.params;
    const updates: any = {};

    const {
      name,
      code,
      description,
      isActive,
      isDefault,
      serviceCode,
      domesticInternational,
      estimatedDeliveryDays,
      handlingDays,
      priority,
      displayOnFrontend,
      allowFreeShipping,
      minWeight,
      maxWeight,
      minOrderValue,
      maxOrderValue,
      shippingClass
    } = req.body;

    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;
    if (isDefault !== undefined) updates.isDefault = isDefault === 'true' || isDefault === true;
    if (serviceCode !== undefined) updates.serviceCode = serviceCode || undefined;
    if (domesticInternational !== undefined) updates.domesticInternational = domesticInternational;
    if (estimatedDeliveryDays !== undefined) updates.estimatedDeliveryDays = estimatedDeliveryDays ? JSON.parse(estimatedDeliveryDays) : undefined;
    if (handlingDays !== undefined) updates.handlingDays = handlingDays ? parseInt(handlingDays) : undefined;
    if (priority !== undefined) updates.priority = priority ? parseInt(priority) : undefined;
    if (displayOnFrontend !== undefined) updates.displayOnFrontend = displayOnFrontend === 'true' || displayOnFrontend === true;
    if (allowFreeShipping !== undefined) updates.allowFreeShipping = allowFreeShipping === 'true' || allowFreeShipping === true;
    if (minWeight !== undefined) updates.minWeight = minWeight ? parseFloat(minWeight).toString() : null;
    if (maxWeight !== undefined) updates.maxWeight = maxWeight ? parseFloat(maxWeight).toString() : null;
    if (minOrderValue !== undefined) updates.minOrderValue = minOrderValue ? parseFloat(minOrderValue).toString() : null;
    if (maxOrderValue !== undefined) updates.maxOrderValue = maxOrderValue ? parseFloat(maxOrderValue).toString() : null;
    if (shippingClass !== undefined) updates.shippingClass = shippingClass || undefined;

    const method = await shippingMethodRepo.update(methodId, updates);

    if (!method) {
      throw new Error('Shipping method not found after update');
    }

    res.redirect(`/hub/shipping/methods/${methodId}?success=Shipping method updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    

    try {
      const method = await shippingMethodRepo.findById(req.params.methodId);

      adminRespond(req, res, 'shipping/methods/edit', {
        pageName: `Edit: ${method?.name || 'Method'}`,
        method,
        error: error.message || 'Failed to update shipping method',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update shipping method',
      });
    }
  }
};

export const deleteShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { methodId } = req.params;

    const success = await shippingMethodRepo.delete(methodId);

    if (!success) {
      throw new Error('Failed to delete shipping method');
    }

    res.json({ success: true, message: 'Shipping method deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message || 'Failed to delete shipping method' });
  }
};

export const activateShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { methodId } = req.params;

    const method = await shippingMethodRepo.activate(methodId);

    if (!method) {
      throw new Error('Shipping method not found');
    }

    res.json({ success: true, message: 'Shipping method activated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message || 'Failed to activate shipping method' });
  }
};

export const deactivateShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { methodId } = req.params;

    const method = await shippingMethodRepo.deactivate(methodId);

    if (!method) {
      throw new Error('Shipping method not found');
    }

    res.json({ success: true, message: 'Shipping method deactivated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate shipping method' });
  }
};
