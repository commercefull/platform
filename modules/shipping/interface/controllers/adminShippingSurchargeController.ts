/**
 * Shipping Surcharge Controller
 * Handles shipping surcharge management for the Admin Hub
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { shippingConfigRepository } from '../../application/wired';
import { adminRespond } from '../../../../libs/adminRespond';
import { logger } from '../../../../libs/logger';

const surchargeRepo = shippingConfigRepository.surcharges;

// ============================================================================
// List Surcharges
// ============================================================================

export const listShippingSurcharges = async (req: TypedRequest, res: Response): Promise<void> => {
  const rateId = req.query.rateId as string | undefined;
  const activeOnly = req.query.activeOnly !== 'false';

  let surcharges;
  if (rateId) {
    surcharges = await surchargeRepo.findByRateId(rateId, activeOnly);
  } else {
    surcharges = await surchargeRepo.findByRateId('', false);
  }

  adminRespond(req, res, 'shipping/surcharges/index', {
    pageName: 'Shipping Surcharges',
    surcharges,
    filters: { rateId: rateId || '', activeOnly },
    success: req.query.success || null,
  });
};

// ============================================================================
// Create Surcharge Form
// ============================================================================

export const createShippingSurchargeForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const rateId = req.query.rateId as string | undefined;

  adminRespond(req, res, 'shipping/surcharges/create', {
    pageName: 'Create Shipping Surcharge',
    rateId: rateId || '',
  });
};

// ============================================================================
// Create Surcharge
// ============================================================================

export const createShippingSurcharge = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { shippingRateId, type, calculationType, value, conditions, isActive } = body;

    if (!shippingRateId || !type || !calculationType || value === undefined) {
      adminRespond(req, res, 'shipping/surcharges/create', {
        pageName: 'Create Shipping Surcharge',
        error: 'Missing required fields: shippingRateId, type, calculationType, value',
        formData: body,
      });
      return;
    }

    const surcharge = await surchargeRepo.create({
      shippingRateId,
      type: type as 'fuel' | 'remoteArea' | 'residential' | 'oversize' | 'signature' | 'insurance',
      calculationType: calculationType as 'flat' | 'percentage',
      value,
      conditions: conditions ? JSON.parse(conditions as string) : null,
      isActive: isActive === 'true' || isActive === true,
    });

    res.redirect(`/admin/shipping/surcharges/${surcharge.shippingSurchargeId}?success=Surcharge created successfully`);
  } catch (error: unknown) {
    logger.warning('Error creating shipping surcharge:', error);
    adminRespond(req, res, 'shipping/surcharges/create', {
      pageName: 'Create Shipping Surcharge',
      error: (error as Error).message || 'Failed to create surcharge',
      formData: req.body as RequestBody,
    });
  }
};

// ============================================================================
// View Surcharge
// ============================================================================

export const viewShippingSurcharge = async (req: TypedRequest, res: Response): Promise<void> => {
  const { surchargeId } = req.params;

  const surcharge = await surchargeRepo.findById(surchargeId);

  if (!surcharge) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Shipping surcharge not found',
    });
    return;
  }

  adminRespond(req, res, 'shipping/surcharges/view', {
    pageName: `Surcharge: ${surcharge.type}`,
    surcharge,
    success: req.query.success || null,
  });
};

// ============================================================================
// Edit Surcharge Form
// ============================================================================

export const editShippingSurchargeForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { surchargeId } = req.params;

  const surcharge = await surchargeRepo.findById(surchargeId);

  if (!surcharge) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Shipping surcharge not found',
    });
    return;
  }

  adminRespond(req, res, 'shipping/surcharges/edit', {
    pageName: `Edit: ${surcharge.type} Surcharge`,
    surcharge,
  });
};

// ============================================================================
// Update Surcharge
// ============================================================================

export const updateShippingSurcharge = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { surchargeId } = req.params;
    const body = req.body as RequestBody;
    const updates: Record<string, unknown> = {};

    if (body.type !== undefined) updates.type = body.type;
    if (body.calculationType !== undefined) updates.calculationType = body.calculationType;
    if (body.value !== undefined) updates.value = body.value;
    if (body.conditions !== undefined) {
      updates.conditions = body.conditions ? JSON.parse(body.conditions as string) : null;
    }
    if (body.isActive !== undefined) updates.isActive = body.isActive === 'true' || body.isActive === true;

    const surcharge = await surchargeRepo.update(surchargeId, updates);

    if (!surcharge) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Shipping surcharge not found after update',
      });
      return;
    }

    res.redirect(`/admin/shipping/surcharges/${surchargeId}?success=Surcharge updated successfully`);
  } catch (error: unknown) {
    logger.warning('Error updating shipping surcharge:', error);
    const { surchargeId } = req.params;
    adminRespond(req, res, 'shipping/surcharges/edit', {
      pageName: 'Edit Shipping Surcharge',
      surcharge: await surchargeRepo.findById(surchargeId),
      error: (error as Error).message || 'Failed to update surcharge',
    });
  }
};

// ============================================================================
// Delete Surcharge
// ============================================================================

export const deleteShippingSurcharge = async (req: TypedRequest, res: Response): Promise<void> => {
  const { surchargeId } = req.params;

  const deleted = await surchargeRepo.delete(surchargeId);

  if (!deleted) {
    res.json({ success: false, message: 'Surcharge not found' });
    return;
  }

  res.json({ success: true, message: 'Surcharge deleted successfully' });
};
