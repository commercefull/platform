/**
 * Customer Controller for Admin Hub
 * Uses customer use cases directly from modules - no HTTP API calls
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { VerifyCustomerCommand } from '../../../modules/customer/application/useCases/VerifyCustomer';
import { AddAddressCommand } from '../../../modules/customer/application/useCases/ManageAddresses';
import {
  getCustomerUseCase,
  updateCustomerUseCase,
  deactivateCustomerUseCase,
  reactivateCustomerUseCase,
  verifyCustomerUseCase,
  manageAddressesUseCase,
} from '../../../modules/customer/application/useCases/wired';
import { ManageCustomersUseCase } from '../../../modules/customer/application/useCases/ManageCustomer';
import { adminRespond } from '../../respond';

const manageCustomersUseCase = new ManageCustomersUseCase();

// ============================================================================
// List Customers
// ============================================================================

export const listCustomers = async (req: TypedRequest, res: Response): Promise<void> => {
  const { search, status, limit, offset, orderBy, orderDirection } = req.query;

  // For now, using direct repo query until we create ListCustomersUseCase
  // TODO: Create ListCustomersUseCase in modules/customer/useCases
  const queryOptions = {
    limit: parseInt(limit as string) || 50,
    offset: parseInt(offset as string) || 0,
    orderBy: (orderBy as string) || 'createdAt',
    orderDirection: (orderDirection as 'asc' | 'desc') || 'desc',
    search: search as string | undefined,
    status: status as 'active' | 'inactive' | 'suspended' | undefined,
  };

  const result = await manageCustomersUseCase.findAll(undefined, queryOptions);

  // Calculate pagination info
  const page = Math.floor(queryOptions.offset / queryOptions.limit) + 1;
  const pages = Math.ceil((result.total || 0) / queryOptions.limit);

  adminRespond(req, res, 'customers/index', {
    pageName: 'Customers',
    customers: result.data || result,
    pagination: {
      total: result.total || (result.data ? result.data.length : 0),
      limit: queryOptions.limit,
      offset: queryOptions.offset,
      page,
      pages,
      hasMore: (result.total || 0) > queryOptions.offset + queryOptions.limit,
    },
    filters: {
      search: search || '',
      status: status || '',
      orderBy: orderBy || 'createdAt',
      orderDirection: orderDirection || 'desc',
    },

    success: req.query.success || null,
  });
  
};

// ============================================================================
// View Customer
// ============================================================================

export const viewCustomer = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;

  const customer = await getCustomerUseCase.execute({ customerId });

  if (!customer) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Customer not found',
    });
    return;
  }

  // Get customer addresses
  const addresses = await manageAddressesUseCase.getAddresses(customerId);

  adminRespond(req, res, 'customers/view', {
    pageName: `Customer: ${customer.firstName} ${customer.lastName}`,
    customer,
    addresses,

    success: req.query.success || null,
  });
  
};

// ============================================================================
// Edit Customer Form
// ============================================================================

export const editCustomerForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;

  const customer = await getCustomerUseCase.execute({ customerId });

  if (!customer) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Customer not found',
    });
    return;
  }

  adminRespond(req, res, 'customers/edit', {
    pageName: `Edit: ${customer.firstName} ${customer.lastName}`,
    customer,
  });
  
};

// ============================================================================
// Update Customer
// ============================================================================

export const updateCustomer = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;
  const updates = req.body as RequestBody;

  await updateCustomerUseCase.execute({ customerId, updates });

  res.redirect(`/hub/customers/${customerId}?success=Customer updated successfully`);
  
};

// ============================================================================
// Deactivate Customer (AJAX)
// ============================================================================

export const deactivateCustomer = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;
  const body = req.body as RequestBody;
  const { reason } = body;

  await deactivateCustomerUseCase.execute({ customerId, reason });

  res.json({ success: true, message: 'Customer deactivated' });
  
};

// ============================================================================
// Reactivate Customer (AJAX)
// ============================================================================

export const reactivateCustomer = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;

  await reactivateCustomerUseCase.execute({ customerId });

  res.json({ success: true, message: 'Customer reactivated' });
  
};

// ============================================================================
// Verify Customer (AJAX)
// ============================================================================

export const verifyCustomer = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;
  const verificationType = ((req.body as RequestBody).verificationType as 'email' | 'phone') || 'email';

  const command = new VerifyCustomerCommand(customerId, verificationType);
  await verifyCustomerUseCase.execute(command);

  res.json({ success: true, message: 'Customer verified' });
  
};

// ============================================================================
// Customer Addresses
// ============================================================================

export const customerAddresses = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;

  const customer = await getCustomerUseCase.execute({ customerId });

  if (!customer) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Customer not found',
    });
    return;
  }

  const addresses = await manageAddressesUseCase.getAddresses(customerId);

  adminRespond(req, res, 'customers/addresses', {
    pageName: `Addresses: ${customer.firstName} ${customer.lastName}`,
    customer,
    addresses,

    success: req.query.success || null,
  });
  
};

// ============================================================================
// Add Customer Address
// ============================================================================

export const addCustomerAddress = async (req: TypedRequest, res: Response): Promise<void> => {
  const { customerId } = req.params;
  const addressData = req.body as RequestBody;

  const addCommand = new AddAddressCommand(
    customerId,
    addressData.addressLine1,
    addressData.city,
    addressData.state,
    addressData.postalCode,
    addressData.country,
    addressData.countryCode || 'US',
    addressData.addressType || 'shipping',
    addressData.addressLine2,
    addressData.phone,
    addressData.firstName,
    addressData.lastName,
    addressData.company,
    addressData.isDefault === 'true' || addressData.isDefault === true,
  );
  await manageAddressesUseCase.addAddress(addCommand);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.json({ success: true, message: 'Address added' });
  } else {
    res.redirect(`/hub/customers/${customerId}/addresses?success=Address added`);
  }
  
};
