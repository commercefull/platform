/**
 * Tax Controller for Admin Hub
 * Manages tax rates, zones, and classes
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import * as adminTaxRepo from '../../../modules/tax/infrastructure/repositories/adminTaxRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// List Tax Settings
// ============================================================================

export const listTaxSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const taxRates = await adminTaxRepo.findAllTaxRates();
    const taxZones = await adminTaxRepo.findAllTaxZones();
    const taxClasses = await adminTaxRepo.findAllTaxClasses();

    adminRespond(req, res, 'tax/index', {
      pageName: 'Tax Management',
      taxRates,
      taxZones,
      taxClasses,

      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load tax settings',
    });
  }
};

// ============================================================================
// Tax Rates CRUD
// ============================================================================

export const createTaxRate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, rate, country, state, taxClass, isActive } = body;

    await adminTaxRepo.createTaxRate({
      name,
      rate: parseFloat(rate),
      country: country || undefined,
      state: state || undefined,
      taxClass: taxClass || undefined,
      isActive: isActive === 'true',
    });

    res.redirect('/hub/tax?success=Tax rate created');
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.redirect('/hub/tax?error=' + encodeURIComponent((error as Error).message));
  }
};

export const updateTaxRate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { taxRateId } = req.params;
    const body = req.body as RequestBody;
    const { name, rate, country, state, taxClass, isActive } = body;

    await adminTaxRepo.updateTaxRate(taxRateId, {
      name,
      rate: parseFloat(rate),
      country: country || undefined,
      state: state || undefined,
      taxClass: taxClass || undefined,
      isActive: isActive === 'true',
    });

    res.redirect('/hub/tax?success=Tax rate updated');
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteTaxRate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { taxRateId } = req.params;
    await adminTaxRepo.softDeleteTaxRate(taxRateId);
    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Tax Zones CRUD
// ============================================================================

export const createTaxZone = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, description, countries, isActive } = body;
    const countriesArray = countries ? countries.split(',').map((c: string) => c.trim()) : [];

    await adminTaxRepo.createTaxZone({
      name,
      description: description || undefined,
      countries: countriesArray,
      isActive: isActive === 'true',
    });

    res.redirect('/hub/tax?success=Tax zone created');
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.redirect('/hub/tax?error=' + encodeURIComponent((error as Error).message));
  }
};

export const updateTaxZone = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { taxZoneId } = req.params;
    const body = req.body as RequestBody;
    const { name, description, countries, isActive } = body;
    const countriesArray = countries ? countries.split(',').map((c: string) => c.trim()) : [];

    await adminTaxRepo.updateTaxZone(taxZoneId, {
      name,
      description: description || undefined,
      countries: countriesArray,
      isActive: isActive === 'true',
    });

    res.redirect('/hub/tax?success=Tax zone updated');
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteTaxZone = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { taxZoneId } = req.params;
    await adminTaxRepo.softDeleteTaxZone(taxZoneId);
    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Tax Classes CRUD
// ============================================================================

export const createTaxClass = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, description } = body;

    await adminTaxRepo.createTaxClass({
      name,
      description: description || undefined,
    });

    res.redirect('/hub/tax?success=Tax class created');
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.redirect('/hub/tax?error=' + encodeURIComponent((error as Error).message));
  }
};

export const updateTaxClass = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { taxClassId } = req.params;
    const body = req.body as RequestBody;
    const { name, description } = body;

    await adminTaxRepo.updateTaxClass(taxClassId, {
      name,
      description: description || undefined,
    });

    res.redirect('/hub/tax?success=Tax class updated');
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteTaxClass = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { taxClassId } = req.params;
    await adminTaxRepo.softDeleteTaxClass(taxClassId);
    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
