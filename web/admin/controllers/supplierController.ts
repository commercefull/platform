/**
 * Supplier Controller
 * Handles supplier management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import supplierRepo from '../../../modules/supplier/repos/supplierRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Supplier Management
// ============================================================================

export const listSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const isActive = req.query.isActive !== 'false';
    const isApproved = req.query.isApproved !== 'false';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    let suppliers: any[] = [];

    if (status) {
      suppliers = await supplierRepo.findByStatus(status as any);
    } else {
      suppliers = await supplierRepo.findAll(isActive, isApproved);
    }

    // Get statistics
    const stats = await supplierRepo.getStatistics();

    adminRespond(req, res, 'operations/suppliers/index', {
      pageName: 'Suppliers',
      suppliers,
      stats,
      filters: { status, isActive, isApproved },
      pagination: { limit, offset },

      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load suppliers',
    });
  }
};

export const createSupplierForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/suppliers/create', {
      pageName: 'Create Supplier',
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
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
    } = req.body;

    const supplier = await supplierRepo.create({
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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'operations/suppliers/create', {
      pageName: 'Create Supplier',
      error: error.message || 'Failed to create supplier',
      formData: req.body,
    });
  }
};

export const viewSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;

    const supplier = await supplierRepo.findById(supplierId);

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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load supplier',
    });
  }
};

export const editSupplierForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;

    const supplier = await supplierRepo.findById(supplierId);

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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;
    const updates: any = {};

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
    } = req.body;

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

    const supplier = await supplierRepo.update(supplierId, updates);

    if (!supplier) {
      throw new Error('Supplier not found after update');
    }

    res.redirect(`/hub/suppliers/${supplierId}?success=Supplier updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    try {
      const supplier = await supplierRepo.findById(req.params.supplierId);

      adminRespond(req, res, 'operations/suppliers/edit', {
        pageName: `Edit: ${supplier?.name || 'Supplier'}`,
        supplier,
        error: error.message || 'Failed to update supplier',
        formData: req.body,
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update supplier',
      });
    }
  }
};

export const approveSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;

    const supplier = await supplierRepo.approve(supplierId);

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    res.json({ success: true, message: 'Supplier approved successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to approve supplier' });
  }
};

export const suspendSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;

    const supplier = await supplierRepo.suspend(supplierId);

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    res.json({ success: true, message: 'Supplier suspended successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to suspend supplier' });
  }
};

export const activateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;

    const supplier = await supplierRepo.activate(supplierId);

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    res.json({ success: true, message: 'Supplier activated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to activate supplier' });
  }
};

export const deactivateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;

    const supplier = await supplierRepo.deactivate(supplierId);

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    res.json({ success: true, message: 'Supplier deactivated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate supplier' });
  }
};

export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;

    const success = await supplierRepo.delete(supplierId);

    if (!success) {
      throw new Error('Failed to delete supplier');
    }

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete supplier' });
  }
};
