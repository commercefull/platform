/**
 * Storefront Address Controller
 * Manages customer address book
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { ManageStorefrontAddressesUseCase } from '../../../modules/customer/application/useCases/ManageStorefrontAddresses';

const manageStorefrontAddressesUseCase = new ManageStorefrontAddressesUseCase();

interface CustomerUser {
  id: string;
  customerId: string;
  email: string;
}

/**
 * GET: List customer addresses
 */
export const listAddresses = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const addresses = await manageStorefrontAddressesUseCase.findActiveByCustomerId(user.customerId);

  storefrontRespond(req, res, 'addresses/index', {
    pageName: 'My Addresses',
    addresses,
  });
  
};

/**
 * GET: Add address form
 */
export const addAddressForm = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  storefrontRespond(req, res, 'addresses/create', {
    pageName: 'Add Address',
  });
  
};

/**
 * POST: Add new address
 */
export const addAddress = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const body = req.body as RequestBody;
  const { firstName, lastName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = body;

  await manageStorefrontAddressesUseCase.create({
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
  });

  return res.redirect('/addresses');
  
};

/**
 * GET: Edit address form
 */
export const editAddressForm = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const { addressId } = req.params;

  const address = await manageStorefrontAddressesUseCase.findActiveById(addressId, user.customerId);

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
  
};

/**
 * POST: Update address
 */
export const updateAddress = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const { addressId } = req.params;
  const body = req.body as RequestBody;
  const { firstName, lastName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } = body;

  if (isDefault) {
    await manageStorefrontAddressesUseCase.unsetDefaultsExcept(user.customerId, addressId);
  }
  await manageStorefrontAddressesUseCase.update(addressId, {
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
  
};

/**
 * POST: Delete address (soft delete)
 */
export const deleteAddress = async (req: TypedRequest, res: Response) => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin');
  }

  const { addressId } = req.params;

  await manageStorefrontAddressesUseCase.softDelete(addressId, user.customerId);

  return res.redirect('/addresses');
  
};
