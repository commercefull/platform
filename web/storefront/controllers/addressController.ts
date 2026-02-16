/**
 * Storefront Address Controller
 * Manages customer address book
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { query, queryOne } from '../../../libs/db';
import { storefrontRespond } from '../../respond';

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
}

/**
 * GET: List customer addresses
 */
export const listAddresses = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const addresses = await query<any[]>(
      `SELECT * FROM "customerAddress"
       WHERE "customerId" = $1 AND "deletedAt" IS NULL
       ORDER BY "isDefault" DESC, "createdAt" DESC`,
      [user.customerId],
    );

    storefrontRespond(req, res, 'addresses/index', {
      pageName: 'My Addresses',
      addresses: addresses || [],
    });
  } catch (error) {
    logger.error('Error loading addresses:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load addresses',
    });
  }
};

/**
 * GET: Add address form
 */
export const addAddressForm = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    storefrontRespond(req, res, 'addresses/create', {
      pageName: 'Add Address',
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load form',
    });
  }
};

/**
 * POST: Add new address
 */
export const addAddress = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { firstName, lastName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await query(
        `UPDATE "customerAddress" SET "isDefault" = false, "updatedAt" = NOW()
         WHERE "customerId" = $1 AND "isDefault" = true`,
        [user.customerId],
      );
    }

    await queryOne<any>(
      `INSERT INTO "customerAddress" (
        "customerId", "firstName", "lastName", "addressLine1", "addressLine2",
        "city", "state", "postalCode", "country", "phone", "isDefault",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING "customerAddressId"`,
      [user.customerId, firstName, lastName, addressLine1, addressLine2 || null, city, state || null, postalCode, country, phone || null, !!isDefault],
    );

    return res.redirect('/addresses');
  } catch (error) {
    logger.error('Error adding address:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to add address',
    });
  }
};

/**
 * GET: Edit address form
 */
export const editAddressForm = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { addressId } = req.params;

    const address = await queryOne<any>(
      `SELECT * FROM "customerAddress"
       WHERE "customerAddressId" = $1 AND "customerId" = $2 AND "deletedAt" IS NULL`,
      [addressId, user.customerId],
    );

    if (!address) {
      return storefrontRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Address not found',
      });
    }

    storefrontRespond(req, res, 'addresses/edit', {
      pageName: 'Edit Address',
      address,
    });
  } catch (error) {
    logger.error('Error:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load address',
    });
  }
};

/**
 * POST: Update address
 */
export const updateAddress = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { addressId } = req.params;
    const { firstName, lastName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = req.body;

    if (isDefault) {
      await query(
        `UPDATE "customerAddress" SET "isDefault" = false, "updatedAt" = NOW()
         WHERE "customerId" = $1 AND "isDefault" = true AND "customerAddressId" != $2`,
        [user.customerId, addressId],
      );
    }

    await queryOne<any>(
      `UPDATE "customerAddress" SET
        "firstName" = $1, "lastName" = $2, "addressLine1" = $3, "addressLine2" = $4,
        "city" = $5, "state" = $6, "postalCode" = $7, "country" = $8, "phone" = $9,
        "isDefault" = $10, "updatedAt" = NOW()
       WHERE "customerAddressId" = $11 AND "customerId" = $12 AND "deletedAt" IS NULL
       RETURNING "customerAddressId"`,
      [firstName, lastName, addressLine1, addressLine2 || null, city, state || null, postalCode, country, phone || null, !!isDefault, addressId, user.customerId],
    );

    return res.redirect('/addresses');
  } catch (error) {
    logger.error('Error updating address:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to update address',
    });
  }
};

/**
 * POST: Delete address (soft delete)
 */
export const deleteAddress = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin');
    }

    const { addressId } = req.params;

    await queryOne<any>(
      `UPDATE "customerAddress" SET "deletedAt" = NOW(), "updatedAt" = NOW()
       WHERE "customerAddressId" = $1 AND "customerId" = $2 AND "deletedAt" IS NULL
       RETURNING "customerAddressId"`,
      [addressId, user.customerId],
    );

    return res.redirect('/addresses');
  } catch (error) {
    logger.error('Error deleting address:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to delete address',
    });
  }
};
