import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import SupplierRepo from '../repos/supplierRepo';
import { successResponse, errorResponse, validationErrorResponse } from '../../../libs/apiResponse';

const supplierRepo = SupplierRepo;

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, isActive, isApproved, minRating, category, tag, currency, search, limit = '50', offset = '0' } = req.query;

    let suppliers;

    if (search) {
      // Use search functionality
      suppliers = await supplierRepo.search(search as string);
    } else {
      // Use filters
      const filters: any = {};
      if (status) filters.status = status as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isApproved !== undefined) filters.isApproved = isApproved === 'true';
      if (minRating) filters.minRating = parseFloat(minRating as string);
      if (category) filters.category = category as string;
      if (tag) filters.tag = tag as string;
      if (currency) filters.currency = currency as string;

      suppliers = await supplierRepo.findWithFilters(filters, parseInt(limit as string), parseInt(offset as string));
    }

    successResponse(res, suppliers);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch suppliers');
  }
};

export const getSupplierById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplier = await supplierRepo.findById(id);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch supplier');
  }
};

export const getSupplierByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const supplier = await supplierRepo.findByCode(code);

    if (!supplier) {
      errorResponse(res, `Supplier with code ${code} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch supplier');
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
      isActive,
      isApproved,
      status,
      rating,
      taxId,
      paymentTerms,
      paymentMethod,
      currency,
      minOrderValue,
      leadTime,
      notes,
      categories,
      tags,
      customFields,
    } = req.body;

    // Validate required fields
    const errors: string[] = [];
    if (!name) errors.push('name is required');
    if (!code) errors.push('code is required');

    if (errors.length > 0) {
      validationErrorResponse(res, errors);
      return;
    }

    const supplierParams = {
      name,
      code,
      description,
      website,
      email,
      phone,
      isActive,
      isApproved,
      status,
      rating,
      taxId,
      paymentTerms,
      paymentMethod,
      currency,
      minOrderValue,
      leadTime,
      notes,
      categories,
      tags,
      customFields,
    };

    const supplier = await supplierRepo.create(supplierParams);
    successResponse(res, supplier, 201);
  } catch (error: any) {
    logger.error('Error:', error);

    if (error.message.includes('already exists')) {
      errorResponse(res, error.message, 409);
    } else {
      errorResponse(res, 'Failed to create supplier');
    }
  }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateParams = req.body;

    const supplier = await supplierRepo.update(id, updateParams);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update supplier');
  }
};

export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await supplierRepo.delete(id);

    if (!deleted) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, { message: 'Supplier deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to delete supplier');
  }
};

export const updateSupplierStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      validationErrorResponse(res, ['status is required']);
      return;
    }

    const supplier = await supplierRepo.updateStatus(id, status);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update supplier status');
  }
};

export const updateSupplierVisibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      validationErrorResponse(res, ['isActive is required']);
      return;
    }

    const supplier = await supplierRepo.update(id, { isActive });

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update supplier visibility');
  }
};

export const approveSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplier = await supplierRepo.approve(id);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to approve supplier');
  }
};

export const suspendSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplier = await supplierRepo.suspend(id);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to suspend supplier');
  }
};

export const getSupplierStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const statistics = await supplierRepo.getStatistics();
    successResponse(res, statistics);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch supplier statistics');
  }
};

// ---------- Supplier Address Methods ----------

export const getSupplierAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when supplier address repo is available
    successResponse(res, []);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch supplier addresses');
  }
};

export const createSupplierAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when supplier address repo is available
    successResponse(res, {}, 201);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to create supplier address');
  }
};

export const updateSupplierAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when supplier address repo is available
    successResponse(res, {});
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update supplier address');
  }
};

export const deleteSupplierAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when supplier address repo is available
    successResponse(res, { message: 'Supplier address deleted successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to delete supplier address');
  }
};

// ---------- Supplier Product Methods ----------

export const getSupplierProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when supplier product repo is available
    successResponse(res, []);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch supplier products');
  }
};

export const addProductToSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when supplier product repo is available
    successResponse(res, {}, 201);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to add product to supplier');
  }
};

export const updateSupplierProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when supplier product repo is available
    successResponse(res, {});
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update supplier product');
  }
};

export const removeProductFromSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    // TODO: Implement when supplier product repo is available
    successResponse(res, { message: 'Product removed from supplier successfully' });
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to remove product from supplier');
  }
};
