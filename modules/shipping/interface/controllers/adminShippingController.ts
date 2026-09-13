/**
 * Shipping Controller
 * Handles shipping management for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageShippingMethodsUseCase } from '../../application/useCases/ManageShippingAdmin';
import { adminRespond } from '../../../../libs/adminRespond';
import { buildFormObject, FieldConfig } from '../../../../libs/formParsing';

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

const shippingMethodCreateFields: FieldConfig[] = [
  { name: 'shippingCarrierId', default: null },
  { name: 'name' },
  { name: 'code' },
  { name: 'description', transform: 'stringOrUndefined' },
  { name: 'isActive', transform: 'boolTrue' },
  { name: 'isDefault', transform: 'boolTrue' },
  { name: 'serviceCode', transform: 'stringOrUndefined' },
  { name: 'domesticInternational', transform: 'stringOrUndefined', default: 'both' },
  { name: 'estimatedDeliveryDays', transform: 'json', falsyValue: undefined },
  { name: 'handlingDays', transform: 'int', default: 1, falsyValue: 1 },
  { name: 'priority', transform: 'int', default: 0, falsyValue: 0 },
  { name: 'displayOnFrontend', transform: 'boolNotFalse' },
  { name: 'allowFreeShipping', transform: 'boolNotFalse' },
  { name: 'minWeight', transform: 'floatStr', falsyValue: null },
  { name: 'maxWeight', transform: 'floatStr', falsyValue: null },
  { name: 'minOrderValue', transform: 'floatStr', falsyValue: null },
  { name: 'maxOrderValue', transform: 'floatStr', falsyValue: null },
  { name: 'dimensionRestrictions', default: undefined },
  { name: 'shippingClass', transform: 'stringOrUndefined' },
  { name: 'customFields', default: undefined },
  { name: 'createdBy', default: null },
];

function parseShippingMethodCreateInput(body: RequestBody) {
  return buildFormObject(body as Record<string, unknown>, shippingMethodCreateFields);
}

export const createShippingMethod = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const method = await manageShippingMethodsUseCase.create(
      parseShippingMethodCreateInput(req.body as RequestBody) as Parameters<typeof manageShippingMethodsUseCase.create>[0],
    );

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

const shippingMethodUpdateFields: FieldConfig[] = [
  { name: 'name' },
  { name: 'code' },
  { name: 'description' },
  { name: 'isActive', transform: 'boolTrue' },
  { name: 'isDefault', transform: 'boolTrue' },
  { name: 'serviceCode', transform: 'stringOrUndefined' },
  { name: 'domesticInternational' },
  { name: 'estimatedDeliveryDays', transform: 'json', falsyValue: undefined },
  { name: 'handlingDays', transform: 'int', falsyValue: undefined },
  { name: 'priority', transform: 'int', falsyValue: undefined },
  { name: 'displayOnFrontend', transform: 'boolTrue' },
  { name: 'allowFreeShipping', transform: 'boolTrue' },
  { name: 'minWeight', transform: 'floatStr', falsyValue: null },
  { name: 'maxWeight', transform: 'floatStr', falsyValue: null },
  { name: 'minOrderValue', transform: 'floatStr', falsyValue: null },
  { name: 'maxOrderValue', transform: 'floatStr', falsyValue: null },
  { name: 'shippingClass', transform: 'stringOrUndefined' },
];

function parseShippingMethodUpdates(body: RequestBody): Record<string, unknown> {
  return buildFormObject(body as Record<string, unknown>, shippingMethodUpdateFields);
}

export const updateShippingMethod = async (req: TypedRequest, res: Response): Promise<void> => {
  const { methodId } = req.params;
  const updates = parseShippingMethodUpdates(req.body as RequestBody);

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
