/**
 * Tax Controller for Admin Hub
 * Manages tax rates, zones, and classes
 */

import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
import { adminRespond } from '../../../../libs/adminRespond';
import {
  manageTaxRecordsUseCase,
  manageAdminTaxUseCase,
  approveTaxExemptionUseCase,
  rejectTaxExemptionUseCase,
} from '../../application/wired';

// ============================================================================
// List Tax Settings
// ============================================================================

export const listTaxSettings = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const createTaxRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const { name, rate, country, state, taxClass, isActive } = body as {
      name: string;
      rate: string;
      country?: string;
      state?: string;
      taxClass?: string;
      isActive?: string;
    };

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

export const updateTaxRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { taxRateId } = req.params;
  const body = req.body as HttpRequestBody;
  const { name, rate, country, state, taxClass, isActive } = body as {
    name: string;
    rate: string;
    country?: string;
    state?: string;
    taxClass?: string;
    isActive?: string;
  };

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

export const deleteTaxRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { taxRateId } = req.params;
  await manageAdminTaxUseCase.softDeleteTaxRate(taxRateId);
  res.json({ success: true });
};

// ============================================================================
// Tax Zones CRUD
// ============================================================================

export const createTaxZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const { name, description, countries, isActive } = body as {
      name: string;
      description?: string;
      countries?: string;
      isActive?: string;
    };
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

export const updateTaxZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { taxZoneId } = req.params;
  const body = req.body as HttpRequestBody;
  const { name, description, countries, isActive } = body as {
    name: string;
    description?: string;
    countries?: string;
    isActive?: string;
  };
  const countriesArray = countries ? countries.split(',').map((c: string) => c.trim()) : [];

  await manageAdminTaxUseCase.updateTaxZone(taxZoneId, {
    name,
    description: description || undefined,
    countries: countriesArray,
    isActive: isActive === 'true',
  });

  res.redirect('/hub/tax?success=Tax zone updated');
};

export const deleteTaxZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { taxZoneId } = req.params;
  await manageAdminTaxUseCase.softDeleteTaxZone(taxZoneId);
  res.json({ success: true });
};

// ============================================================================
// Tax Classes CRUD
// ============================================================================

export const createTaxClass = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const { name, description } = body as { name: string; description?: string };

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

export const updateTaxClass = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { taxClassId } = req.params;
  const body = req.body as HttpRequestBody;
  const { name, description } = body as { name: string; description?: string };

  await manageAdminTaxUseCase.updateTaxClass(taxClassId, {
    name,
    description: description || undefined,
  });

  res.redirect('/hub/tax?success=Tax class updated');
};

export const deleteTaxClass = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { taxClassId } = req.params;
  await manageAdminTaxUseCase.softDeleteTaxClass(taxClassId);
  res.json({ success: true });
};

// ============================================================================
// Tax Exemption Management (Epic F)
// ============================================================================

export const listTaxExemptions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const status = (req.query.status as string) || undefined;
  const exemptions = await manageTaxRecordsUseCase.findAllTaxExemptions(status as never);

  adminRespond(req, res, 'tax/exemptions', {
    pageName: 'Tax Exemptions',
    exemptions,
    filterStatus: status || 'all',
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

export const approveTaxExemption = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { exemptionId } = req.params;
    const verifiedBy = (req.user as { id?: string })?.id || 'admin';
    await approveTaxExemptionUseCase.execute(exemptionId, verifiedBy);
    res.redirect('/hub/tax/exemptions?success=Exemption approved');
  } catch (error: unknown) {
    logger.warn('Error approving tax exemption:', error);
    res.redirect('/hub/tax/exemptions?error=' + encodeURIComponent((error as Error).message));
  }
};

export const rejectTaxExemption = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { exemptionId } = req.params;
    const body = req.body as HttpRequestBody;
    const reason = body.reason as string | undefined;
    await rejectTaxExemptionUseCase.execute(exemptionId, reason);
    res.redirect('/hub/tax/exemptions?success=Exemption rejected');
  } catch (error: unknown) {
    logger.warn('Error rejecting tax exemption:', error);
    res.redirect('/hub/tax/exemptions?error=' + encodeURIComponent((error as Error).message));
  }
};
