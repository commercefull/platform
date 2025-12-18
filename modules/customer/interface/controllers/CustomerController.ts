/**
 * Customer Controller
 * HTTP interface for customer operations
 */

import { Request, Response } from 'express';
import CustomerRepo from '../../infrastructure/repositories/CustomerRepository';
import { RegisterCustomerCommand, RegisterCustomerUseCase } from '../../useCases/RegisterCustomer';
import { GetCustomerCommand, GetCustomerUseCase } from '../../useCases/GetCustomer';
import { UpdateCustomerCommand, UpdateCustomerUseCase } from '../../useCases/UpdateCustomer';
import { DeleteCustomerCommand, DeleteCustomerUseCase } from '../../useCases/DeleteCustomer';
import { VerifyCustomerCommand, VerifyCustomerUseCase } from '../../useCases/VerifyCustomer';
import { DeactivateCustomerCommand, DeactivateCustomerUseCase } from '../../useCases/DeactivateCustomer';
import { ReactivateCustomerCommand, ReactivateCustomerUseCase } from '../../useCases/ReactivateCustomer';
import { ChangePasswordCommand, ChangePasswordUseCase } from '../../useCases/ChangePassword';
import { AddAddressCommand, UpdateAddressCommand, DeleteAddressCommand, SetDefaultAddressCommand, ManageAddressesUseCase } from '../../useCases/ManageAddresses';

// ============================================================================
// Helpers
// ============================================================================

function respond(req: Request, res: Response, data: any, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: Request, res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Customer Routes
// ============================================================================

export const registerCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, firstName, lastName, password, phone, dateOfBirth, preferredCurrency, preferredLanguage } = req.body;

    const command = new RegisterCustomerCommand(
      email, firstName, lastName, password, phone,
      dateOfBirth ? new Date(dateOfBirth) : undefined,
      preferredCurrency, preferredLanguage
    );

    const useCase = new RegisterCustomerUseCase(CustomerRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 201);
  } catch (error: any) {
    console.error('Error registering customer:', error);
    respondError(req, res, error.message || 'Failed to register', error.message.includes('exists') ? 409 : 500);
  }
};

export const getCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const command = new GetCustomerCommand(customerId);
    const useCase = new GetCustomerUseCase(CustomerRepo);
    const customer = await useCase.execute(command);

    if (!customer) {
      respondError(req, res, 'Customer not found', 404);
      return;
    }

    respond(req, res, customer);
  } catch (error: any) {
    console.error('Error getting customer:', error);
    respondError(req, res, error.message || 'Failed to get customer', 500);
  }
};

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id;
    if (!customerId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const command = new GetCustomerCommand(customerId);
    const useCase = new GetCustomerUseCase(CustomerRepo);
    const customer = await useCase.execute(command);

    if (!customer) {
      respondError(req, res, 'Customer not found', 404);
      return;
    }

    respond(req, res, customer);
  } catch (error: any) {
    console.error('Error getting profile:', error);
    respondError(req, res, error.message || 'Failed to get profile', 500);
  }
};

export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id;
    if (!customerId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const command = new UpdateCustomerCommand(customerId, req.body);
    const useCase = new UpdateCustomerUseCase(CustomerRepo);
    const result = await useCase.execute(command);

    respond(req, res, result);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    respondError(req, res, error.message || 'Failed to update profile', 500);
  }
};

// ============================================================================
// Address Routes
// ============================================================================

export const getAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id;
    if (!customerId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const useCase = new ManageAddressesUseCase(CustomerRepo);
    const addresses = await useCase.getAddresses(customerId);

    respond(req, res, { addresses });
  } catch (error: any) {
    console.error('Error getting addresses:', error);
    respondError(req, res, error.message || 'Failed to get addresses', 500);
  }
};

export const addAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id;
    if (!customerId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const { addressLine1, addressLine2, city, state, postalCode, country, countryCode, addressType, phone, firstName, lastName, company, isDefault } = req.body;

    const command = new AddAddressCommand(
      customerId, addressLine1, city, state, postalCode, country, countryCode || country, addressType,
      addressLine2, phone, firstName, lastName, company, isDefault
    );

    const useCase = new ManageAddressesUseCase(CustomerRepo);
    const address = await useCase.addAddress(command);

    respond(req, res, address, 201);
  } catch (error: any) {
    console.error('Error adding address:', error);
    respondError(req, res, error.message || 'Failed to add address', 500);
  }
};

export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id;
    const { addressId } = req.params;

    if (!customerId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const command = new UpdateAddressCommand(customerId, addressId, req.body);
    const useCase = new ManageAddressesUseCase(CustomerRepo);
    const address = await useCase.updateAddress(command);

    respond(req, res, address);
  } catch (error: any) {
    console.error('Error updating address:', error);
    respondError(req, res, error.message || 'Failed to update address', 500);
  }
};

export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id;
    const { addressId } = req.params;

    if (!customerId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const command = new DeleteAddressCommand(customerId, addressId);
    const useCase = new ManageAddressesUseCase(CustomerRepo);
    await useCase.deleteAddress(command);

    respond(req, res, { deleted: true });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    respondError(req, res, error.message || 'Failed to delete address', 500);
  }
};

export const setDefaultAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id;
    const { addressId } = req.params;
    const { addressType } = req.body;

    if (!customerId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    if (!['billing', 'shipping'].includes(addressType)) {
      respondError(req, res, 'Invalid address type', 400);
      return;
    }

    const command = new SetDefaultAddressCommand(customerId, addressId, addressType);
    const useCase = new ManageAddressesUseCase(CustomerRepo);
    await useCase.setDefaultAddress(command);

    respond(req, res, { success: true });
  } catch (error: any) {
    console.error('Error setting default address:', error);
    respondError(req, res, error.message || 'Failed to set default address', 500);
  }
};

// ============================================================================
// Business/Admin Customer Routes
// ============================================================================

export const listCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20, offset = 0, search, status, isVerified } = req.query;
    
    const filters: any = {};
    if (search) filters.search = search as string;
    if (status) filters.status = status as string;
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true';

    const customers = await CustomerRepo.findAll(filters, {
      limit: Number(limit),
      offset: Number(offset)
    });

    respond(req, res, customers);
  } catch (error: any) {
    console.error('Error listing customers:', error);
    respondError(req, res, error.message || 'Failed to list customers', 500);
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, firstName, lastName, password, phone, dateOfBirth, preferredCurrency, preferredLanguage } = req.body;

    const command = new RegisterCustomerCommand(
      email, firstName, lastName, password, phone,
      dateOfBirth ? new Date(dateOfBirth) : undefined,
      preferredCurrency, preferredLanguage
    );

    const useCase = new RegisterCustomerUseCase(CustomerRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 201);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    respondError(req, res, error.message || 'Failed to create customer', error.message?.includes('exists') ? 409 : 500);
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const command = new UpdateCustomerCommand(customerId, req.body);
    const useCase = new UpdateCustomerUseCase(CustomerRepo);
    const result = await useCase.execute(command);

    respond(req, res, result);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    respondError(req, res, error.message || 'Failed to update customer', 500);
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { reason } = req.body;

    const command = new DeleteCustomerCommand(customerId, reason);
    const useCase = new DeleteCustomerUseCase(CustomerRepo);
    const result = await useCase.execute(command);

    respond(req, res, result);
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    respondError(req, res, error.message || 'Failed to delete customer', error.message?.includes('not found') ? 404 : 500);
  }
};

export const verifyCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { verificationType = 'email' } = req.body;

    const command = new VerifyCustomerCommand(customerId, verificationType);
    const useCase = new VerifyCustomerUseCase(CustomerRepo);
    const result = await useCase.execute(command);

    respond(req, res, result);
  } catch (error: any) {
    console.error('Error verifying customer:', error);
    respondError(req, res, error.message || 'Failed to verify customer', error.message?.includes('not found') ? 404 : 500);
  }
};

export const deactivateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { reason } = req.body;

    const command = new DeactivateCustomerCommand(customerId, reason);
    const useCase = new DeactivateCustomerUseCase(CustomerRepo);
    const result = await useCase.execute(command);

    respond(req, res, result);
  } catch (error: any) {
    console.error('Error deactivating customer:', error);
    respondError(req, res, error.message || 'Failed to deactivate customer', error.message?.includes('not found') ? 404 : 500);
  }
};

export const reactivateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;

    const command = new ReactivateCustomerCommand(customerId);
    const useCase = new ReactivateCustomerUseCase(CustomerRepo);
    const result = await useCase.execute(command);

    respond(req, res, result);
  } catch (error: any) {
    console.error('Error reactivating customer:', error);
    respondError(req, res, error.message || 'Failed to reactivate customer', error.message?.includes('not found') ? 404 : 500);
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId || (req as any).user?._id;
    if (!customerId) {
      respondError(req, res, 'Authentication required', 401);
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const command = new ChangePasswordCommand(customerId, currentPassword, newPassword);
    const useCase = new ChangePasswordUseCase(CustomerRepo);
    const result = await useCase.execute(command);

    respond(req, res, result);
  } catch (error: any) {
    console.error('Error changing password:', error);
    respondError(req, res, error.message || 'Failed to change password', error.message?.includes('incorrect') ? 401 : 500);
  }
};

// ============================================================================
// Customer Address Routes (Business)
// ============================================================================

export const getCustomerAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const useCase = new ManageAddressesUseCase(CustomerRepo);
    const addresses = await useCase.getAddresses(customerId);

    respond(req, res, { addresses });
  } catch (error: any) {
    console.error('Error getting customer addresses:', error);
    respondError(req, res, error.message || 'Failed to get addresses', 500);
  }
};

export const addCustomerAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { addressLine1, addressLine2, city, state, postalCode, country, countryCode, addressType, phone, firstName, lastName, company, isDefault } = req.body;

    const command = new AddAddressCommand(
      customerId, addressLine1, city, state, postalCode, country, countryCode || country, addressType,
      addressLine2, phone, firstName, lastName, company, isDefault
    );

    const useCase = new ManageAddressesUseCase(CustomerRepo);
    const address = await useCase.addAddress(command);

    respond(req, res, address, 201);
  } catch (error: any) {
    console.error('Error adding customer address:', error);
    respondError(req, res, error.message || 'Failed to add address', 500);
  }
};
