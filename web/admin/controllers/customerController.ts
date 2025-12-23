/**
 * Customer Controller for Admin Hub
 * Uses customer use cases directly from modules - no HTTP API calls
 */

import { Request, Response } from 'express';
import CustomerRepo from '../../../modules/customer/infrastructure/repositories/CustomerRepository';
import { GetCustomerCommand, GetCustomerUseCase } from '../../../modules/customer/useCases/GetCustomer';
import { UpdateCustomerCommand, UpdateCustomerUseCase } from '../../../modules/customer/useCases/UpdateCustomer';
import { DeactivateCustomerCommand, DeactivateCustomerUseCase } from '../../../modules/customer/useCases/DeactivateCustomer';
import { ReactivateCustomerCommand, ReactivateCustomerUseCase } from '../../../modules/customer/useCases/ReactivateCustomer';
import { VerifyCustomerCommand, VerifyCustomerUseCase } from '../../../modules/customer/useCases/VerifyCustomer';
import { AddAddressCommand, ManageAddressesUseCase } from '../../../modules/customer/useCases/ManageAddresses';
import { adminRespond } from 'web/respond';

// ============================================================================
// List Customers
// ============================================================================

export const listCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, limit, offset, orderBy, orderDirection } = req.query;

    // For now, using direct repo query until we create ListCustomersUseCase
    // TODO: Create ListCustomersUseCase in modules/customer/useCases
    const queryOptions: any = {
      limit: parseInt(limit as string) || 50,
      offset: parseInt(offset as string) || 0,
      orderBy: (orderBy as string) || 'createdAt',
      orderDirection: (orderDirection as 'asc' | 'desc') || 'desc'
    };

    if (search) queryOptions.search = search;
    if (status) queryOptions.status = status;

    const result = await CustomerRepo.findAll(queryOptions);

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
        hasMore: (result.total || 0) > (queryOptions.offset + queryOptions.limit)
      },
      filters: {
        search: search || '',
        status: status || '',
        orderBy: orderBy || 'createdAt',
        orderDirection: orderDirection || 'desc'
      },
      
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing customers:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load customers',
    });
  }
};

// ============================================================================
// View Customer
// ============================================================================

export const viewCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;

    const useCase = new GetCustomerUseCase(CustomerRepo);
    const customer = await useCase.execute({ customerId });

    if (!customer) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Customer not found',
      });
      return;
    }

    // Get customer addresses
    const addressUseCase = new ManageAddressesUseCase(CustomerRepo);
    const addresses = await addressUseCase.getAddresses(customerId);

    adminRespond(req, res, 'customers/view', {
      pageName: `Customer: ${customer.firstName} ${customer.lastName}`,
      customer,
      addresses,
      
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing customer:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load customer',
    });
  }
};

// ============================================================================
// Edit Customer Form
// ============================================================================

export const editCustomerForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;

    const useCase = new GetCustomerUseCase(CustomerRepo);
    const customer = await useCase.execute({ customerId });

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
  } catch (error: any) {
    console.error('Error loading edit customer form:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

// ============================================================================
// Update Customer
// ============================================================================

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const updates = req.body;

    const useCase = new UpdateCustomerUseCase(CustomerRepo);
    await useCase.execute({ customerId, updates });

    res.redirect(`/hub/customers/${customerId}?success=Customer updated successfully`);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    
    // Reload form with error
    try {
      const getUseCase = new GetCustomerUseCase(CustomerRepo);
      const customer = await getUseCase.execute({ customerId: req.params.customerId });

      adminRespond(req, res, 'customers/edit', {
        pageName: `Edit: ${customer?.firstName || ''} ${customer?.lastName || ''}`,
        customer,
        error: error.message || 'Failed to update customer',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update customer',
      });
    }
  }
};

// ============================================================================
// Deactivate Customer (AJAX)
// ============================================================================

export const deactivateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const { reason } = req.body;

    const useCase = new DeactivateCustomerUseCase(CustomerRepo);
    await useCase.execute({ customerId, reason });

    res.json({ success: true, message: 'Customer deactivated' });
  } catch (error: any) {
    console.error('Error deactivating customer:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate customer' });
  }
};

// ============================================================================
// Reactivate Customer (AJAX)
// ============================================================================

export const reactivateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;

    const useCase = new ReactivateCustomerUseCase(CustomerRepo);
    await useCase.execute({ customerId });

    res.json({ success: true, message: 'Customer reactivated' });
  } catch (error: any) {
    console.error('Error reactivating customer:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reactivate customer' });
  }
};

// ============================================================================
// Verify Customer (AJAX)
// ============================================================================

export const verifyCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const verificationType = (req.body.verificationType as 'email' | 'phone') || 'email';

    const command = new VerifyCustomerCommand(customerId, verificationType);
    const useCase = new VerifyCustomerUseCase(CustomerRepo);
    await useCase.execute(command);

    res.json({ success: true, message: 'Customer verified' });
  } catch (error: any) {
    console.error('Error verifying customer:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to verify customer' });
  }
};

// ============================================================================
// Customer Addresses
// ============================================================================

export const customerAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;

    const getUseCase = new GetCustomerUseCase(CustomerRepo);
    const customer = await getUseCase.execute({ customerId });

    if (!customer) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Customer not found',
      });
      return;
    }

    const addressUseCase = new ManageAddressesUseCase(CustomerRepo);
    const addresses = await addressUseCase.getAddresses(customerId);

    adminRespond(req, res, 'customers/addresses', {
      pageName: `Addresses: ${customer.firstName} ${customer.lastName}`,
      customer,
      addresses,
      
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error loading customer addresses:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load addresses',
    });
  }
};

// ============================================================================
// Add Customer Address
// ============================================================================

export const addCustomerAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const addressData = req.body;

    const useCase = new ManageAddressesUseCase(CustomerRepo);
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
      addressData.isDefault === 'true' || addressData.isDefault === true
    );
    await useCase.addAddress(addCommand);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true, message: 'Address added' });
    } else {
      res.redirect(`/hub/customers/${customerId}/addresses?success=Address added`);
    }
  } catch (error: any) {
    console.error('Error adding customer address:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: error.message || 'Failed to add address' });
    } else {
      res.redirect(`/hub/customers/${req.params.customerId}/addresses?error=${encodeURIComponent(error.message)}`);
    }
  }
};
