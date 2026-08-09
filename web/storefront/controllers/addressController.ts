/**
 * Storefront Address Controller
 * Manages customer address book
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { CustomerAddressRepo, CustomerAddressCreateParams } from '../../../modules/customer/infrastructure/repositories/customerAddressRepo';

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

    const addressRepo = new CustomerAddressRepo();
    const addresses = await addressRepo.findActiveByCustomerId(user.customerId);

    storefrontRespond(req, res, 'addresses/index', {
      pageName: 'My Addresses',
      addresses,
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

    const body = req.body as RequestBody;
    const { firstName, lastName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = body;

    const addressRepo = new CustomerAddressRepo();
    await addressRepo.create({
      customerId: user.customerId,
      firstName,
      lastName,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state: state || null,
      postalCode,
      country,
      phone: phone || null,
      isDefault: !!isDefault,
    } as CustomerAddressCreateParams);

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

    const addressRepo = new CustomerAddressRepo();
    const address = await addressRepo.findActiveById(addressId, user.customerId);

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
    const body = req.body as RequestBody;
    const { firstName, lastName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = body;

    const addressRepo = new CustomerAddressRepo();
    if (isDefault) {
      await addressRepo.unsetDefaultsExcept(user.customerId, addressId);
    }
    await addressRepo.update(addressId, {
      firstName: firstName as string,
      lastName: lastName as string,
      addressLine1: addressLine1 as string,
      addressLine2: (addressLine2 as string) || null,
      city: city as string,
      state: (state as string) || null,
      postalCode: postalCode as string,
      country: country as string,
      phone: (phone as string) || null,
      isDefault: !!isDefault,
    });

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

    const addressRepo = new CustomerAddressRepo();
    await addressRepo.softDelete(addressId, user.customerId);

    return res.redirect('/addresses');
  } catch (error) {
    logger.error('Error deleting address:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to delete address',
    });
  }
};
