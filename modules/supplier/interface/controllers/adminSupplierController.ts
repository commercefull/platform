/**
 * Supplier Controller
 * Handles supplier management for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageSuppliersAdminUseCase } from '../../application/useCases/ManageSuppliersAdmin';
import { adminRespond } from '../../../../libs/adminRespond';
import { buildFormObject, FieldConfig } from '../../../../libs/formParsing';

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

const supplierCreateFields: FieldConfig[] = [
  { name: 'name' },
  { name: 'code' },
  { name: 'description', transform: 'stringOrUndefined' },
  { name: 'website', transform: 'stringOrUndefined' },
  { name: 'email', transform: 'stringOrUndefined' },
  { name: 'phone', transform: 'stringOrUndefined' },
  { name: 'status', transform: 'stringOrUndefined', default: 'pending' },
  { name: 'isActive', default: true },
  { name: 'isApproved', default: false },
  { name: 'currency', transform: 'stringOrUndefined', default: 'USD' },
  { name: 'minOrderValue', transform: 'float', falsyValue: undefined },
  { name: 'leadTime', transform: 'int', falsyValue: undefined },
  { name: 'paymentTerms', transform: 'stringOrUndefined' },
  { name: 'paymentMethod', transform: 'stringOrUndefined' },
  { name: 'taxId', transform: 'stringOrUndefined' },
  { name: 'notes', transform: 'stringOrUndefined' },
  { name: 'categories', transform: 'passthrough', falsyValue: undefined },
  { name: 'tags', transform: 'passthrough', falsyValue: undefined },
];

function parseSupplierCreateInput(body: RequestBody) {
  const result = buildFormObject(body as Record<string, unknown>, supplierCreateFields);
  if (typeof result.categories === 'string') {
    result.categories = result.categories.split(',').map((c: string) => c.trim());
  }
  if (typeof result.tags === 'string') {
    result.tags = result.tags.split(',').map((t: string) => t.trim());
  }
  return result;
}

export const createSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const supplier = await manageSuppliersUseCase.create(
      parseSupplierCreateInput(req.body as RequestBody) as Parameters<typeof manageSuppliersUseCase.create>[0],
    );

    res.redirect(`/hub/suppliers/${supplier.supplierId}?success=Supplier created successfully`);
  } catch (error: unknown) {
    logger.warning('Error:', error);

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

const supplierUpdateFields: FieldConfig[] = [
  { name: 'name' },
  { name: 'description', transform: 'stringOrUndefined' },
  { name: 'website', transform: 'stringOrUndefined' },
  { name: 'email', transform: 'stringOrUndefined' },
  { name: 'phone', transform: 'stringOrUndefined' },
  { name: 'status' },
  { name: 'currency' },
  { name: 'minOrderValue', transform: 'float', falsyValue: undefined },
  { name: 'leadTime', transform: 'int', falsyValue: undefined },
  { name: 'paymentTerms', transform: 'stringOrUndefined' },
  { name: 'paymentMethod', transform: 'stringOrUndefined' },
  { name: 'taxId', transform: 'stringOrUndefined' },
  { name: 'notes', transform: 'stringOrUndefined' },
  { name: 'categories', transform: 'passthrough', falsyValue: undefined },
  { name: 'tags', transform: 'passthrough', falsyValue: undefined },
  { name: 'rating', transform: 'float', falsyValue: undefined },
];

function parseSupplierUpdates(body: RequestBody): Record<string, unknown> {
  const updates = buildFormObject(body as Record<string, unknown>, supplierUpdateFields);
  if (typeof updates.categories === 'string') {
    updates.categories = updates.categories.split(',').map((c: string) => c.trim());
  }
  if (typeof updates.tags === 'string') {
    updates.tags = updates.tags.split(',').map((t: string) => t.trim());
  }
  return updates;
}

export const updateSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { supplierId } = req.params;
  const updates = parseSupplierUpdates(req.body as RequestBody);

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
