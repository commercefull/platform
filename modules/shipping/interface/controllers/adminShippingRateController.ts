/**
 * Shipping Rate Controller
 * Handles shipping rate management for the Admin Hub
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import {
  ManageShippingRatesUseCase,
  ManageShippingZonesUseCase,
  ManageShippingMethodsAdminUseCase,
} from '../../application/useCases/ManageShippingRates';
import { adminRespond } from '../../../../libs/adminRespond';
import { buildFormObject, FieldConfig } from '../../../../libs/formParsing';

const manageShippingRatesUseCase = new ManageShippingRatesUseCase();
const manageShippingZonesUseCase = new ManageShippingZonesUseCase();
const manageShippingMethodsUseCase = new ManageShippingMethodsAdminUseCase();

// ============================================================================
// Shipping Rates Management
// ============================================================================

export const listShippingRates = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const createShippingRateForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const zones = await manageShippingZonesUseCase.findAll();
  const methods = await manageShippingMethodsUseCase.findAll();

  adminRespond(req, res, 'shipping/rates/create', {
    pageName: 'Create Shipping Rate',
    zones,
    methods,
  });
};

export const createShippingRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
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
  } = body as {
    shippingZoneId: string;
    shippingMethodId: string;
    name?: string;
    description?: string;
    rateType: string;
    baseRate: string;
    perItemRate?: string;
    freeThreshold?: string;
    minRate?: string;
    maxRate?: string;
    currency?: string;
    taxable?: string;
    priority?: string;
    validFrom?: string;
    validTo?: string;
  };

  const rate = await manageShippingRatesUseCase.create({
    shippingZoneId,
    shippingMethodId,
    name: name || null,
    description: description || null,
    rateType,
    baseRate,
    perItemRate: perItemRate || null,
    freeThreshold: freeThreshold || null,
    minRate: minRate || null,
    maxRate: maxRate || null,
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

export const viewShippingRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const editShippingRateForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

const shippingRateUpdateFields: FieldConfig[] = [
  { name: 'name', transform: 'stringOrUndefined' },
  { name: 'description', transform: 'stringOrUndefined' },
  { name: 'rateType' },
  { name: 'baseRate' },
  { name: 'perItemRate', transform: 'stringOrUndefined' },
  { name: 'freeThreshold', transform: 'stringOrUndefined' },
  { name: 'minRate', transform: 'stringOrUndefined' },
  { name: 'maxRate', transform: 'stringOrUndefined' },
  { name: 'currency' },
  { name: 'taxable', transform: 'boolTrue' },
  { name: 'priority', transform: 'int', falsyValue: 0 },
  { name: 'validFrom', transform: 'date', falsyValue: null },
  { name: 'validTo', transform: 'date', falsyValue: null },
  { name: 'isActive', transform: 'boolTrue' },
];

function parseShippingRateUpdates(body: HttpRequestBody): Record<string, unknown> {
  return buildFormObject(body as Record<string, unknown>, shippingRateUpdateFields);
}

export const updateShippingRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { rateId } = req.params;
  const updates = parseShippingRateUpdates(req.body as HttpRequestBody);

  const rate = await manageShippingRatesUseCase.update(rateId, updates);

  if (!rate) {
    throw new Error('Shipping rate not found after update');
  }

  res.redirect(`/hub/shipping/rates/${rateId}?success=Shipping rate updated successfully`);
};

export const activateShippingRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { rateId } = req.params;

  const rate = await manageShippingRatesUseCase.activate(rateId);

  if (!rate) {
    throw new Error('Shipping rate not found');
  }

  res.json({ success: true, message: 'Shipping rate activated successfully' });
};

export const deactivateShippingRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { rateId } = req.params;

  const rate = await manageShippingRatesUseCase.deactivate(rateId);

  if (!rate) {
    throw new Error('Shipping rate not found');
  }

  res.json({ success: true, message: 'Shipping rate deactivated successfully' });
};

export const deleteShippingRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { rateId } = req.params;

  const success = await manageShippingRatesUseCase.delete(rateId);

  if (!success) {
    throw new Error('Failed to delete shipping rate');
  }

  res.json({ success: true, message: 'Shipping rate deleted successfully' });
};

export const calculateShippingRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const { zoneId, methodId, orderTotal, itemCount, weight } = body as {
    zoneId: string;
    methodId: string;
    orderTotal: string;
    itemCount: string;
    weight?: string;
  };

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
