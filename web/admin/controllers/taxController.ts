/**
 * Tax Controller for Admin Hub
 * Manages tax rates, zones, and classes
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// List Tax Settings
// ============================================================================

export const listTaxSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const taxRates = await query<Array<any>>(
      `SELECT * FROM "taxRate" WHERE "deletedAt" IS NULL ORDER BY "name"`
    );

    const taxZones = await query<Array<any>>(
      `SELECT * FROM "taxZone" WHERE "deletedAt" IS NULL ORDER BY "name"`
    );

    const taxClasses = await query<Array<any>>(
      `SELECT tc.*, COUNT(p."productId") as "productCount"
       FROM "taxClass" tc
       LEFT JOIN "product" p ON tc."taxClassId" = p."taxClass"
       WHERE tc."deletedAt" IS NULL
       GROUP BY tc."taxClassId"
       ORDER BY tc."name"`
    );

    res.render('admin/views/tax/index', {
      pageName: 'Tax Management',
      taxRates: taxRates || [],
      taxZones: taxZones || [],
      taxClasses: taxClasses || [],
      user: req.user,
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing tax settings:', error);
    res.status(500).render('admin/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load tax settings',
      user: req.user
    });
  }
};

// ============================================================================
// Tax Rates CRUD
// ============================================================================

export const createTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, rate, country, state, taxClass, isActive } = req.body;

    await query(
      `INSERT INTO "taxRate" ("taxRateId", "name", "rate", "country", "state", "taxClass", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [uuidv4(), name, parseFloat(rate), country || null, state || null, taxClass || null, isActive === 'true']
    );

    res.redirect('/hub/tax?success=Tax rate created');
  } catch (error: any) {
    console.error('Error creating tax rate:', error);
    res.redirect('/hub/tax?error=' + encodeURIComponent(error.message));
  }
};

export const updateTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxRateId } = req.params;
    const { name, rate, country, state, taxClass, isActive } = req.body;

    await query(
      `UPDATE "taxRate" SET "name" = $1, "rate" = $2, "country" = $3, "state" = $4, "taxClass" = $5, "isActive" = $6, "updatedAt" = NOW()
       WHERE "taxRateId" = $7`,
      [name, parseFloat(rate), country || null, state || null, taxClass || null, isActive === 'true', taxRateId]
    );

    res.redirect('/hub/tax?success=Tax rate updated');
  } catch (error: any) {
    console.error('Error updating tax rate:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxRateId } = req.params;
    await query(`UPDATE "taxRate" SET "deletedAt" = NOW() WHERE "taxRateId" = $1`, [taxRateId]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tax rate:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Tax Zones CRUD
// ============================================================================

export const createTaxZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, countries, isActive } = req.body;
    const countriesArray = countries ? countries.split(',').map((c: string) => c.trim()) : [];

    await query(
      `INSERT INTO "taxZone" ("taxZoneId", "name", "description", "countries", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [uuidv4(), name, description || null, JSON.stringify(countriesArray), isActive === 'true']
    );

    res.redirect('/hub/tax?success=Tax zone created');
  } catch (error: any) {
    console.error('Error creating tax zone:', error);
    res.redirect('/hub/tax?error=' + encodeURIComponent(error.message));
  }
};

export const updateTaxZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxZoneId } = req.params;
    const { name, description, countries, isActive } = req.body;
    const countriesArray = countries ? countries.split(',').map((c: string) => c.trim()) : [];

    await query(
      `UPDATE "taxZone" SET "name" = $1, "description" = $2, "countries" = $3, "isActive" = $4, "updatedAt" = NOW()
       WHERE "taxZoneId" = $5`,
      [name, description || null, JSON.stringify(countriesArray), isActive === 'true', taxZoneId]
    );

    res.redirect('/hub/tax?success=Tax zone updated');
  } catch (error: any) {
    console.error('Error updating tax zone:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTaxZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxZoneId } = req.params;
    await query(`UPDATE "taxZone" SET "deletedAt" = NOW() WHERE "taxZoneId" = $1`, [taxZoneId]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tax zone:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Tax Classes CRUD
// ============================================================================

export const createTaxClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    await query(
      `INSERT INTO "taxClass" ("taxClassId", "name", "description", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [uuidv4(), name, description || null]
    );

    res.redirect('/hub/tax?success=Tax class created');
  } catch (error: any) {
    console.error('Error creating tax class:', error);
    res.redirect('/hub/tax?error=' + encodeURIComponent(error.message));
  }
};

export const updateTaxClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxClassId } = req.params;
    const { name, description } = req.body;

    await query(
      `UPDATE "taxClass" SET "name" = $1, "description" = $2, "updatedAt" = NOW() WHERE "taxClassId" = $3`,
      [name, description || null, taxClassId]
    );

    res.redirect('/hub/tax?success=Tax class updated');
  } catch (error: any) {
    console.error('Error updating tax class:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTaxClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxClassId } = req.params;
    await query(`UPDATE "taxClass" SET "deletedAt" = NOW() WHERE "taxClassId" = $1`, [taxClassId]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tax class:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
