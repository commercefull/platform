/**
 * Supplier Controller
 * Handles supplier management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageSuppliersAdminUseCase } from '../../../modules/supplier/application/useCases/ManageSuppliersAdmin';
import { adminRespond } from '../../respond';

const manageSuppliersUseCase = new ManageSuppliersAdminUseCase();

// ============================================================================
// Supplier Management
// ============================================================================

export const listSuppliers = async (req: TypedRequest, res: Response): Promise<void> => {
  const status = req.query.status as string;
  const isActive = req.query.isActive !== 'false';
  const isApproved = req.query.isApproved !== 'false';
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  let suppliers: unknown[];

  if (status) {
    suppliers = await manageSuppliersUseCase.findByStatus(status as 'active' | 'inactive' | 'pending' | 'suspended' | 'blacklisted');
  } else {
    suppliers = await manageSuppliersUseCase.findAll(isActive, isApproved);
  }

  // Get statistics
  const stats = await manageSuppliersUseCase.getStatistics();

  adminRespond(req, res, 'operations/suppliers/index', {
    pageName: 'Suppliers',
    suppliers,
    stats,
    filters: { status, isActive, isApproved },
    pagination: { limit, offset },

    success: req.query.success || null,
  });
  
};

export const createSupplierForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'operations/suppliers/create', {
    pageName: 'Create Supplier',
  });
  
};

export const createSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const {
      name,
      code,
      description,
      website,
      email,
      phone,
      status,
      currency,
      minOrderValue,
      leadTime,
      paymentTerms,
      paymentMethod,
      taxId,
      notes,
      categories,
      tags,
    } = body;

    const supplier = await manageSuppliersUseCase.create({
      name,
      code,
      description: description || undefined,
      website: website || undefined,
      email: email || undefined,
      phone: phone || undefined,
      status: status || 'pending',
      isActive: true, // Default to active
      isApproved: false, // Require approval process
      currency: currency || 'USD',
      minOrderValue: minOrderValue ? parseFloat(minOrderValue) : undefined,
      leadTime: leadTime ? parseInt(leadTime) : undefined,
      paymentTerms: paymentTerms || undefined,
      paymentMethod: paymentMethod || undefined,
      taxId: taxId || undefined,
      notes: notes || undefined,
      categories: categories ? categories.split(',').map((c: string) => c.trim()) : undefined,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : undefined,
    });

    res.redirect(`/hub/suppliers/${supplier.supplierId}?success=Supplier created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'operations/suppliers/create', {
      pageName: 'Create Supplier',
      error: (error as Error).message || 'Failed to create supplier',
      formData: req.body as RequestBody,
    });
  }
};

export const viewSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { supplierId } = req.params;

  const supplier = await manageSuppliersUseCase.findById(supplierId);

  if (!supplier) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Supplier not found',
    });
    return;
  }

  adminRespond(req, res, 'operations/suppliers/view', {
    pageName: `Supplier: ${supplier.name}`,
    supplier,

    success: req.query.success || null,
  });
  
};

export const editSupplierForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { supplierId } = req.params;

  const supplier = await manageSuppliersUseCase.findById(supplierId);

  if (!supplier) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Supplier not found',
    });
    return;
  }

  adminRespond(req, res, 'operations/suppliers/edit', {
    pageName: `Edit: ${supplier.name}`,
    supplier,
  });
  
};

export const updateSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { supplierId } = req.params;
  const updates: Record<string, unknown> = {};

  const body = req.body as RequestBody;
  const {
    name,
    description,
    website,
    email,
    phone,
    status,
    currency,
    minOrderValue,
    leadTime,
    paymentTerms,
    paymentMethod,
    taxId,
    notes,
    categories,
    tags,
    rating,
  } = body;

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description || undefined;
  if (website !== undefined) updates.website = website || undefined;
  if (email !== undefined) updates.email = email || undefined;
  if (phone !== undefined) updates.phone = phone || undefined;
  if (status !== undefined) updates.status = status;
  if (currency !== undefined) updates.currency = currency;
  if (minOrderValue !== undefined) updates.minOrderValue = minOrderValue ? parseFloat(minOrderValue) : undefined;
  if (leadTime !== undefined) updates.leadTime = leadTime ? parseInt(leadTime) : undefined;
  if (paymentTerms !== undefined) updates.paymentTerms = paymentTerms || undefined;
  if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod || undefined;
  if (taxId !== undefined) updates.taxId = taxId || undefined;
  if (notes !== undefined) updates.notes = notes || undefined;
  if (categories !== undefined) updates.categories = categories ? categories.split(',').map((c: string) => c.trim()) : undefined;
  if (tags !== undefined) updates.tags = tags ? tags.split(',').map((t: string) => t.trim()) : undefined;
  if (rating !== undefined) updates.rating = rating ? parseFloat(rating) : undefined;

  const supplier = await manageSuppliersUseCase.update(supplierId, updates);

  if (!supplier) {
    throw new Error('Supplier not found after update');
  }

  res.redirect(`/hub/suppliers/${supplierId}?success=Supplier updated successfully`);
  
};

export const approveSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { supplierId } = req.params;

  const supplier = await manageSuppliersUseCase.approve(supplierId);

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  res.json({ success: true, message: 'Supplier approved successfully' });
  
};

export const suspendSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { supplierId } = req.params;

  const supplier = await manageSuppliersUseCase.suspend(supplierId);

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  res.json({ success: true, message: 'Supplier suspended successfully' });
  
};

export const activateSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { supplierId } = req.params;

  const supplier = await manageSuppliersUseCase.activate(supplierId);

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  res.json({ success: true, message: 'Supplier activated successfully' });
  
};

export const deactivateSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { supplierId } = req.params;

  const supplier = await manageSuppliersUseCase.deactivate(supplierId);

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  res.json({ success: true, message: 'Supplier deactivated successfully' });
  
};

export const deleteSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { supplierId } = req.params;

  const success = await manageSuppliersUseCase.delete(supplierId);

  if (!success) {
    throw new Error('Failed to delete supplier');
  }

  res.json({ success: true, message: 'Supplier deleted successfully' });
  
};
