/**
 * Shipping Rate Controller
 * Handles shipping rate management for the Admin Hub
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageShippingRatesUseCase, ManageShippingZonesUseCase, ManageShippingMethodsAdminUseCase } from '../../../modules/shipping/application/useCases/ManageShippingRates';
import { adminRespond } from '../../respond';

const manageShippingRatesUseCase = new ManageShippingRatesUseCase();
const manageShippingZonesUseCase = new ManageShippingZonesUseCase();
const manageShippingMethodsUseCase = new ManageShippingMethodsAdminUseCase();

// ============================================================================
// Shipping Rates Management
// ============================================================================

export const listShippingRates = async (req: TypedRequest, res: Response): Promise<void> => {
  const zoneId = req.query.zoneId as string;
  const methodId = req.query.methodId as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const rates = await manageShippingRatesUseCase.findActive(zoneId, methodId);

  // Get zones and methods for filtering
  const zones = await manageShippingZonesUseCase.findAll();
  const methods = await manageShippingMethodsUseCase.findAll();

  adminRespond(req, res, 'shipping/rates/index', {
    pageName: 'Shipping Rates',
    rates,
    zones,
    methods,
    filters: { zoneId, methodId },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
  
};

export const createShippingRateForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const zones = await manageShippingZonesUseCase.findAll();
  const methods = await manageShippingMethodsUseCase.findAll();

  adminRespond(req, res, 'shipping/rates/create', {
    pageName: 'Create Shipping Rate',
    zones,
    methods,
  });
  
};

export const createShippingRate = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const {
    shippingZoneId,
    shippingMethodId,
    name,
    description,
    rateType,
    baseRate,
    perItemRate,
    freeThreshold,
    minRate,
    maxRate,
    currency,
    taxable,
    priority,
    validFrom,
    validTo,
  } = body;

  const rate = await manageShippingRatesUseCase.create({
    shippingZoneId,
    shippingMethodId,
    name: name || undefined,
    description: description || undefined,
    rateType,
    baseRate,
    perItemRate: perItemRate || undefined,
    freeThreshold: freeThreshold || undefined,
    minRate: minRate || undefined,
    maxRate: maxRate || undefined,
    currency: currency || 'USD',
    taxable: taxable === 'true',
    priority: priority ? parseInt(priority) : 0,
    validFrom: validFrom ? new Date(validFrom) : null,
    validTo: validTo ? new Date(validTo) : null,
    isActive: true, // Default to active
    rateMatrix: undefined, // Not implemented in UI yet
    conditions: undefined, // Not implemented in UI yet
    createdBy: 'admin', // Required field
  });

  res.redirect(`/hub/shipping/rates/${rate.shippingRateId}?success=Shipping rate created successfully`);
  
};

export const viewShippingRate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { rateId } = req.params;

  const rate = await manageShippingRatesUseCase.findById(rateId);

  if (!rate) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Shipping rate not found',
    });
    return;
  }

  // Get associated zone and method
  const zone = await manageShippingZonesUseCase.findById(rate.shippingZoneId);
  const method = await manageShippingMethodsUseCase.findById(rate.shippingMethodId);

  adminRespond(req, res, 'shipping/rates/view', {
    pageName: `Rate: ${rate.name || `${zone?.name} - ${method?.name}`}`,
    rate,
    zone,
    method,

    success: req.query.success || null,
  });
  
};

export const editShippingRateForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { rateId } = req.params;

  const rate = await manageShippingRatesUseCase.findById(rateId);

  if (!rate) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Shipping rate not found',
    });
    return;
  }

  const zones = await manageShippingZonesUseCase.findAll();
  const methods = await manageShippingMethodsUseCase.findAll();

  adminRespond(req, res, 'shipping/rates/edit', {
    pageName: `Edit: ${rate.name || 'Shipping Rate'}`,
    rate,
    zones,
    methods,
  });
  
};

export const updateShippingRate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { rateId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
  const {
    name,
    description,
    rateType,
    baseRate,
    perItemRate,
    freeThreshold,
    minRate,
    maxRate,
    currency,
    taxable,
    priority,
    validFrom,
    validTo,
    isActive,
  } = body;

  if (name !== undefined) updates.name = name || undefined;
  if (description !== undefined) updates.description = description || undefined;
  if (rateType !== undefined) updates.rateType = rateType;
  if (baseRate !== undefined) updates.baseRate = baseRate;
  if (perItemRate !== undefined) updates.perItemRate = perItemRate || undefined;
  if (freeThreshold !== undefined) updates.freeThreshold = freeThreshold || undefined;
  if (minRate !== undefined) updates.minRate = minRate || undefined;
  if (maxRate !== undefined) updates.maxRate = maxRate || undefined;
  if (currency !== undefined) updates.currency = currency;
  if (taxable !== undefined) updates.taxable = taxable === 'true';
  if (priority !== undefined) updates.priority = priority ? parseInt(priority) : 0;
  if (validFrom !== undefined) updates.validFrom = validFrom ? new Date(validFrom) : null;
  if (validTo !== undefined) updates.validTo = validTo ? new Date(validTo) : null;
  if (isActive !== undefined) updates.isActive = isActive === 'true';

  const rate = await manageShippingRatesUseCase.update(rateId, updates);

  if (!rate) {
    throw new Error('Shipping rate not found after update');
  }

  res.redirect(`/hub/shipping/rates/${rateId}?success=Shipping rate updated successfully`);
  
};

export const activateShippingRate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { rateId } = req.params;

  const rate = await manageShippingRatesUseCase.activate(rateId);

  if (!rate) {
    throw new Error('Shipping rate not found');
  }

  res.json({ success: true, message: 'Shipping rate activated successfully' });
  
};

export const deactivateShippingRate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { rateId } = req.params;

  const rate = await manageShippingRatesUseCase.deactivate(rateId);

  if (!rate) {
    throw new Error('Shipping rate not found');
  }

  res.json({ success: true, message: 'Shipping rate deactivated successfully' });
  
};

export const deleteShippingRate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { rateId } = req.params;

  const success = await manageShippingRatesUseCase.delete(rateId);

  if (!success) {
    throw new Error('Failed to delete shipping rate');
  }

  res.json({ success: true, message: 'Shipping rate deleted successfully' });
  
};

export const calculateShippingRate = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const { zoneId, methodId, orderTotal, itemCount, weight } = body;

  const rate = await manageShippingRatesUseCase.findByZoneAndMethod(zoneId, methodId);

  if (!rate) {
    res.json({ calculatedRate: null, message: 'No applicable shipping rate found' });
    return;
  }

  const calculatedRate = manageShippingRatesUseCase.calculateRate(
    rate,
    parseFloat(orderTotal) || 0,
    parseInt(itemCount) || 1,
    weight ? parseFloat(weight) : undefined,
  );

  res.json({
    calculatedRate,
    rateId: rate.shippingRateId,
    rateType: rate.rateType,
    currency: rate.currency,
  });
  
};
