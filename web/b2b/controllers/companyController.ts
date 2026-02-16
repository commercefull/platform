/**
 * B2B Company Controller
 * Company profile and user management for B2B portal
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { b2bRespond } from '../../respond';
import { query, queryOne } from '../../../libs/db';

/**
 * GET: Company profile
 */
export const getCompanyProfile = async (req: TypedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.redirect('/b2b/login');

    const company = await queryOne(
      `SELECT * FROM "b2bCompany" WHERE "b2bCompanyId" = $1`,
      [companyId],
    );

    if (!company) {
      (req as any).flash?.('error', 'Company not found');
      return res.redirect('/b2b');
    }

    b2bRespond(req, res, 'company/profile', {
      pageName: 'Company Profile',
      company,
    });
  } catch (error) {
    logger.error('Error:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load company profile' });
  }
};

/**
 * POST: Update company profile
 */
export const updateCompanyProfile = async (req: TypedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.redirect('/b2b/login');

    const { name, taxId, website, phone, address, city, state, postalCode, country } = req.body;

    await query(
      `UPDATE "b2bCompany"
       SET "name" = $1, "taxId" = $2, "website" = $3, "phone" = $4,
           "address" = $5, "city" = $6, "state" = $7, "postalCode" = $8,
           "country" = $9, "updatedAt" = NOW()
       WHERE "b2bCompanyId" = $10`,
      [name, taxId, website, phone, address, city, state, postalCode, country, companyId],
    );

    (req as any).flash?.('success', 'Company profile updated');
    res.redirect('/b2b/company');
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to update company profile');
    res.redirect('/b2b/company');
  }
};

/**
 * GET: List company users
 */
export const listUsers = async (req: TypedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.redirect('/b2b/login');

    const users = await query(
      `SELECT * FROM "b2bCompanyUser" WHERE "b2bCompanyId" = $1 ORDER BY "createdAt" DESC`,
      [companyId],
    );

    b2bRespond(req, res, 'company/users', {
      pageName: 'Company Users',
      users,
    });
  } catch (error) {
    logger.error('Error:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load users' });
  }
};

/**
 * POST: Invite a new company user
 */
export const inviteUser = async (req: TypedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.redirect('/b2b/login');

    const { email, firstName, lastName, role } = req.body;

    if (!email || !firstName || !lastName) {
      (req as any).flash?.('error', 'Email, first name, and last name are required');
      return res.redirect('/b2b/company/users');
    }

    // Check if user already exists
    const existing = await queryOne(
      `SELECT * FROM "b2bCompanyUser" WHERE "b2bCompanyId" = $1 AND "email" = $2`,
      [companyId, email],
    );

    if (existing) {
      (req as any).flash?.('error', 'A user with this email already exists');
      return res.redirect('/b2b/company/users');
    }

    await query(
      `INSERT INTO "b2bCompanyUser" ("b2bCompanyId", "email", "firstName", "lastName", "role", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'invited', NOW(), NOW())`,
      [companyId, email, firstName, lastName, role || 'buyer'],
    );

    (req as any).flash?.('success', `Invitation sent to ${email}`);
    res.redirect('/b2b/company/users');
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to invite user');
    res.redirect('/b2b/company/users');
  }
};

/**
 * GET: Company addresses
 */
export const listAddresses = async (req: TypedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.redirect('/b2b/login');

    const addresses = await query(
      `SELECT * FROM "b2bCompanyAddress" WHERE "b2bCompanyId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC`,
      [companyId],
    );

    b2bRespond(req, res, 'company/addresses', {
      pageName: 'Company Addresses',
      addresses,
    });
  } catch (error) {
    logger.error('Error:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load addresses' });
  }
};

/**
 * POST: Add company address
 */
export const addAddress = async (req: TypedRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.redirect('/b2b/login');

    const { label, type, firstName, lastName, company, address1, address2, city, state, postalCode, country, phone, isDefault } = req.body;

    if (isDefault) {
      await query(
        `UPDATE "b2bCompanyAddress" SET "isDefault" = false WHERE "b2bCompanyId" = $1 AND "type" = $2`,
        [companyId, type || 'shipping'],
      );
    }

    await query(
      `INSERT INTO "b2bCompanyAddress"
       ("b2bCompanyId", "label", "type", "firstName", "lastName", "company", "address1", "address2",
        "city", "state", "postalCode", "country", "phone", "isDefault", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
      [companyId, label, type || 'shipping', firstName, lastName, company, address1, address2, city, state, postalCode, country, phone, !!isDefault],
    );

    (req as any).flash?.('success', 'Address added successfully');
    res.redirect('/b2b/company/addresses');
  } catch (error) {
    logger.error('Error:', error);
    (req as any).flash?.('error', 'Failed to add address');
    res.redirect('/b2b/company/addresses');
  }
};
