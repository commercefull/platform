/**
 * Tax Controller for Admin Hub
 * Manages tax rates, zones, and classes
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageAdminTaxUseCase } from '../../../modules/tax/application/useCases/ManageAdminTax';
import { adminRespond } from '../../respond';

const manageAdminTaxUseCase = new ManageAdminTaxUseCase();

// ============================================================================
// List Tax Settings
// ============================================================================

export const listTaxSettings = async (req: TypedRequest, res: Response): Promise<void> => {
  const taxRates = await manageAdminTaxUseCase.findAllTaxRates();
  const taxZones = await manageAdminTaxUseCase.findAllTaxZones();
  const taxClasses = await manageAdminTaxUseCase.findAllTaxClasses();

  adminRespond(req, res, 'tax/index', {
    pageName: 'Tax Management',
    taxRates,
    taxZones,
    taxClasses,

    success: req.query.success || null,
  });
  
};

// ============================================================================
// Tax Rates CRUD
// ============================================================================

export const createTaxRate = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, rate, country, state, taxClass, isActive } = body;

    await manageAdminTaxUseCase.createTaxRate({
      name,
      rate: parseFloat(rate),
      country: country || undefined,
      state: state || undefined,
      taxClass: taxClass || undefined,
      isActive: isActive === 'true',
    });

    res.redirect('/hub/tax?success=Tax rate created');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    res.redirect('/hub/tax?error=' + encodeURIComponent((error as Error).message));
  }
};

export const updateTaxRate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { taxRateId } = req.params;
  const body = req.body as RequestBody;
  const { name, rate, country, state, taxClass, isActive } = body;

  await manageAdminTaxUseCase.updateTaxRate(taxRateId, {
    name,
    rate: parseFloat(rate),
    country: country || undefined,
    state: state || undefined,
    taxClass: taxClass || undefined,
    isActive: isActive === 'true',
  });

  res.redirect('/hub/tax?success=Tax rate updated');
  
};

export const deleteTaxRate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { taxRateId } = req.params;
  await manageAdminTaxUseCase.softDeleteTaxRate(taxRateId);
  res.json({ success: true });
  
};

// ============================================================================
// Tax Zones CRUD
// ============================================================================

export const createTaxZone = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, description, countries, isActive } = body;
    const countriesArray = countries ? countries.split(',').map((c: string) => c.trim()) : [];

    await manageAdminTaxUseCase.createTaxZone({
      name,
      description: description || undefined,
      countries: countriesArray,
      isActive: isActive === 'true',
    });

    res.redirect('/hub/tax?success=Tax zone created');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    res.redirect('/hub/tax?error=' + encodeURIComponent((error as Error).message));
  }
};

export const updateTaxZone = async (req: TypedRequest, res: Response): Promise<void> => {
  const { taxZoneId } = req.params;
  const body = req.body as RequestBody;
  const { name, description, countries, isActive } = body;
  const countriesArray = countries ? countries.split(',').map((c: string) => c.trim()) : [];

  await manageAdminTaxUseCase.updateTaxZone(taxZoneId, {
    name,
    description: description || undefined,
    countries: countriesArray,
    isActive: isActive === 'true',
  });

  res.redirect('/hub/tax?success=Tax zone updated');
  
};

export const deleteTaxZone = async (req: TypedRequest, res: Response): Promise<void> => {
  const { taxZoneId } = req.params;
  await manageAdminTaxUseCase.softDeleteTaxZone(taxZoneId);
  res.json({ success: true });
  
};

// ============================================================================
// Tax Classes CRUD
// ============================================================================

export const createTaxClass = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, description } = body;

    await manageAdminTaxUseCase.createTaxClass({
      name,
      description: description || undefined,
    });

    res.redirect('/hub/tax?success=Tax class created');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    res.redirect('/hub/tax?error=' + encodeURIComponent((error as Error).message));
  }
};

export const updateTaxClass = async (req: TypedRequest, res: Response): Promise<void> => {
  const { taxClassId } = req.params;
  const body = req.body as RequestBody;
  const { name, description } = body;

  await manageAdminTaxUseCase.updateTaxClass(taxClassId, {
    name,
    description: description || undefined,
  });

  res.redirect('/hub/tax?success=Tax class updated');
  
};

export const deleteTaxClass = async (req: TypedRequest, res: Response): Promise<void> => {
  const { taxClassId } = req.params;
  await manageAdminTaxUseCase.softDeleteTaxClass(taxClassId);
  res.json({ success: true });
  
};
