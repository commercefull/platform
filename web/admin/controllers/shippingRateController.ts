/**
 * Shipping Rate Controller
 * Handles shipping rate management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import shippingRateRepo from '../../../modules/shipping/repos/shippingRateRepo';
import shippingZoneRepo from '../../../modules/shipping/repos/shippingZoneRepo';
import shippingMethodRepo from '../../../modules/shipping/repos/shippingMethodRepo';
import { adminRespond } from 'web/respond';

// ============================================================================
// Shipping Rates Management
// ============================================================================

export const listShippingRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneId = req.query.zoneId as string;
    const methodId = req.query.methodId as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const rates = await shippingRateRepo.findActive(zoneId, methodId);

    // Get zones and methods for filtering
    const zones = await shippingZoneRepo.findAll();
    const methods = await shippingMethodRepo.findAll();

    adminRespond(req, res, 'shipping/rates/index', {
      pageName: 'Shipping Rates',
      rates,
      zones,
      methods,
      filters: { zoneId, methodId },
      pagination: { limit, offset },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load shipping rates',
    });
  }
};

export const createShippingRateForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const zones = await shippingZoneRepo.findAll();
    const methods = await shippingMethodRepo.findAll();

    adminRespond(req, res, 'shipping/rates/create', {
      pageName: 'Create Shipping Rate',
      zones,
      methods,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
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
    } = req.body;

    const rate = await shippingRateRepo.create({
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
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const zones = await shippingZoneRepo.findAll();
      const methods = await shippingMethodRepo.findAll();

      adminRespond(req, res, 'shipping/rates/create', {
        pageName: 'Create Shipping Rate',
        zones,
        methods,
        error: error.message || 'Failed to create shipping rate',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to create shipping rate',
      });
    }
  }
};

export const viewShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rateId } = req.params;

    const rate = await shippingRateRepo.findById(rateId);

    if (!rate) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Shipping rate not found',
      });
      return;
    }

    // Get associated zone and method
    const zone = await shippingZoneRepo.findById(rate.shippingZoneId);
    const method = await shippingMethodRepo.findById(rate.shippingMethodId);

    adminRespond(req, res, 'shipping/rates/view', {
      pageName: `Rate: ${rate.name || `${zone?.name} - ${method?.name}`}`,
      rate,
      zone,
      method,

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load shipping rate',
    });
  }
};

export const editShippingRateForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rateId } = req.params;

    const rate = await shippingRateRepo.findById(rateId);

    if (!rate) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Shipping rate not found',
      });
      return;
    }

    const zones = await shippingZoneRepo.findAll();
    const methods = await shippingMethodRepo.findAll();

    adminRespond(req, res, 'shipping/rates/edit', {
      pageName: `Edit: ${rate.name || 'Shipping Rate'}`,
      rate,
      zones,
      methods,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rateId } = req.params;
    const updates: any = {};

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
    } = req.body;

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

    const rate = await shippingRateRepo.update(rateId, updates);

    if (!rate) {
      throw new Error('Shipping rate not found after update');
    }

    res.redirect(`/hub/shipping/rates/${rateId}?success=Shipping rate updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const rate = await shippingRateRepo.findById(req.params.rateId);
      const zones = await shippingZoneRepo.findAll();
      const methods = await shippingMethodRepo.findAll();

      adminRespond(req, res, 'shipping/rates/edit', {
        pageName: `Edit: ${rate?.name || 'Shipping Rate'}`,
        rate,
        zones,
        methods,
        error: error.message || 'Failed to update shipping rate',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update shipping rate',
      });
    }
  }
};

export const activateShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rateId } = req.params;

    const rate = await shippingRateRepo.activate(rateId);

    if (!rate) {
      throw new Error('Shipping rate not found');
    }

    res.json({ success: true, message: 'Shipping rate activated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to activate shipping rate' });
  }
};

export const deactivateShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rateId } = req.params;

    const rate = await shippingRateRepo.deactivate(rateId);

    if (!rate) {
      throw new Error('Shipping rate not found');
    }

    res.json({ success: true, message: 'Shipping rate deactivated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate shipping rate' });
  }
};

export const deleteShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rateId } = req.params;

    const success = await shippingRateRepo.delete(rateId);

    if (!success) {
      throw new Error('Failed to delete shipping rate');
    }

    res.json({ success: true, message: 'Shipping rate deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete shipping rate' });
  }
};

export const calculateShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId, methodId, orderTotal, itemCount, weight } = req.body;

    const rate = await shippingRateRepo.findByZoneAndMethod(zoneId, methodId);

    if (!rate) {
      res.json({ calculatedRate: null, message: 'No applicable shipping rate found' });
      return;
    }

    const calculatedRate = shippingRateRepo.calculateRate(
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
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ error: error.message || 'Failed to calculate shipping rate' });
  }
};
