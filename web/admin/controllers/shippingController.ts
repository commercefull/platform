/**
 * Shipping Controller
 * Handles shipping management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageShippingMethodsUseCase } from '../../../modules/shipping/application/useCases/ManageShippingAdmin';
import { adminRespond } from '../../respond';

const manageShippingMethodsUseCase = new ManageShippingMethodsUseCase();

// ============================================================================
// Shipping Methods
// ============================================================================

export const listShippingMethods = async (req: TypedRequest, res: Response): Promise<void> => {
  const methods = await manageShippingMethodsUseCase.findAll();

  adminRespond(req, res, 'shipping/methods/index', {
    pageName: 'Shipping Methods',
    methods,

    success: req.query.success || null,
  });
  
};

export const createShippingMethodForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'shipping/methods/create', {
    pageName: 'Create Shipping Method',
  });
  
};

export const createShippingMethod = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
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
      shippingClass,
    } = body;

    const method = await manageShippingMethodsUseCase.create({
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
      createdBy: null,
    });

    res.redirect(`/hub/shipping/methods/${method.shippingMethodId}?success=Shipping method created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'shipping/methods/create', {
      pageName: 'Create Shipping Method',
      error: (error as Error).message || 'Failed to create shipping method',
      formData: req.body as RequestBody,
    });
  }
};

export const viewShippingMethod = async (req: TypedRequest, res: Response): Promise<void> => {
  const { methodId } = req.params;

  const method = await manageShippingMethodsUseCase.findById(methodId);

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

    success: req.query.success || null,
  });
  
};

export const editShippingMethodForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { methodId } = req.params;

  const method = await manageShippingMethodsUseCase.findById(methodId);

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
  
};

export const updateShippingMethod = async (req: TypedRequest, res: Response): Promise<void> => {
  const { methodId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
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
    shippingClass,
  } = body;

  if (name !== undefined) updates.name = name;
  if (code !== undefined) updates.code = code;
  if (description !== undefined) updates.description = description;
  if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;
  if (isDefault !== undefined) updates.isDefault = isDefault === 'true' || isDefault === true;
  if (serviceCode !== undefined) updates.serviceCode = serviceCode || undefined;
  if (domesticInternational !== undefined) updates.domesticInternational = domesticInternational;
  if (estimatedDeliveryDays !== undefined)
    updates.estimatedDeliveryDays = estimatedDeliveryDays ? JSON.parse(estimatedDeliveryDays) : undefined;
  if (handlingDays !== undefined) updates.handlingDays = handlingDays ? parseInt(handlingDays) : undefined;
  if (priority !== undefined) updates.priority = priority ? parseInt(priority) : undefined;
  if (displayOnFrontend !== undefined) updates.displayOnFrontend = displayOnFrontend === 'true' || displayOnFrontend === true;
  if (allowFreeShipping !== undefined) updates.allowFreeShipping = allowFreeShipping === 'true' || allowFreeShipping === true;
  if (minWeight !== undefined) updates.minWeight = minWeight ? parseFloat(minWeight).toString() : null;
  if (maxWeight !== undefined) updates.maxWeight = maxWeight ? parseFloat(maxWeight).toString() : null;
  if (minOrderValue !== undefined) updates.minOrderValue = minOrderValue ? parseFloat(minOrderValue).toString() : null;
  if (maxOrderValue !== undefined) updates.maxOrderValue = maxOrderValue ? parseFloat(maxOrderValue).toString() : null;
  if (shippingClass !== undefined) updates.shippingClass = shippingClass || undefined;

  const method = await manageShippingMethodsUseCase.update(methodId, updates);

  if (!method) {
    throw new Error('Shipping method not found after update');
  }

  res.redirect(`/hub/shipping/methods/${methodId}?success=Shipping method updated successfully`);
  
};

export const deleteShippingMethod = async (req: TypedRequest, res: Response): Promise<void> => {
  const { methodId } = req.params;

  const success = await manageShippingMethodsUseCase.delete(methodId);

  if (!success) {
    throw new Error('Failed to delete shipping method');
  }

  res.json({ success: true, message: 'Shipping method deleted successfully' });
  
};

export const activateShippingMethod = async (req: TypedRequest, res: Response): Promise<void> => {
  const { methodId } = req.params;

  const method = await manageShippingMethodsUseCase.activate(methodId);

  if (!method) {
    throw new Error('Shipping method not found');
  }

  res.json({ success: true, message: 'Shipping method activated successfully' });
  
};

export const deactivateShippingMethod = async (req: TypedRequest, res: Response): Promise<void> => {
  const { methodId } = req.params;

  const method = await manageShippingMethodsUseCase.deactivate(methodId);

  if (!method) {
    throw new Error('Shipping method not found');
  }

  res.json({ success: true, message: 'Shipping method deactivated successfully' });
  
};
