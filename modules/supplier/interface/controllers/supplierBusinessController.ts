import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import SupplierRepo from '../../infrastructure/repositories/supplierRepo';
import { SupplierFilters, SupplierStatus, SupplierCreateParams, SupplierUpdateParams } from '../../infrastructure/repositories/supplierRepo';
import SupplierAddressRepo, { SupplierAddressType, SupplierAddressUpdateParams } from '../../infrastructure/repositories/supplierAddressRepo';
import SupplierProductRepo, { SupplierProductUpdateParams } from '../../infrastructure/repositories/supplierProductRepo';
import { successResponse, errorResponse, validationErrorResponse } from '../../../../libs/apiResponse';

const supplierRepo = SupplierRepo;

export const getSuppliers = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { status, isActive, isApproved, minRating, category, tag, currency, search, limit = '50', offset = '0' } = req.query;

    let suppliers;

    if (search) {
      // Use search functionality
      suppliers = await supplierRepo.search(search as string);
    } else {
      // Use filters
      const filters: SupplierFilters = {};
      if (status) filters.status = status as SupplierStatus;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isApproved !== undefined) filters.isApproved = isApproved === 'true';
      if (minRating) filters.minRating = parseFloat(minRating as string);
      if (category) filters.category = category as string;
      if (tag) filters.tag = tag as string;
      if (currency) filters.currency = currency as string;

      suppliers = await supplierRepo.findWithFilters(filters, parseInt(limit as string), parseInt(offset as string));
    }

    successResponse(res, suppliers);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch suppliers');
  }
};

export const getSupplierById = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplier = await supplierRepo.findById(id);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch supplier');
  }
};

export const getSupplierByCode = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const supplier = await supplierRepo.findByCode(code);

    if (!supplier) {
      errorResponse(res, `Supplier with code ${code} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch supplier');
  }
};

export const createSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
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
    } = req.body as SupplierCreateParams;

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
  } catch (error: unknown) {
    logger.error('Error:', error);

    if ((error as Error).message.includes('already exists')) {
      errorResponse(res, (error as Error).message, 409);
    } else {
      errorResponse(res, 'Failed to create supplier');
    }
  }
};

export const updateSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateParams = req.body as SupplierUpdateParams;

    const supplier = await supplierRepo.update(id, updateParams);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update supplier');
  }
};

export const deleteSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await supplierRepo.delete(id);

    if (!deleted) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, { message: 'Supplier deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to delete supplier');
  }
};

export const updateSupplierStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: SupplierStatus };

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
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update supplier status');
  }
};

export const updateSupplierVisibility = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body as { isActive?: boolean };

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
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update supplier visibility');
  }
};

export const approveSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplier = await supplierRepo.approve(id);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to approve supplier');
  }
};

export const suspendSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const supplier = await supplierRepo.suspend(id);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to suspend supplier');
  }
};

export const getSupplierStatistics = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const statistics = await supplierRepo.getStatistics();
    successResponse(res, statistics);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch supplier statistics');
  }
};

// ---------- Supplier Address Methods ----------

export const getSupplierAddresses = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;
    const addresses = await SupplierAddressRepo.findBySupplierId(supplierId);
    successResponse(res, addresses);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch supplier addresses');
  }
};

export const createSupplierAddress = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;
    const { name, addressLine1, city, state, postalCode, country, addressType, isDefault, contactName, contactEmail, contactPhone, notes } = req.body as {
      name: string;
      addressLine1: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      addressType?: string;
      isDefault?: boolean;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      notes?: string;
      addressLine2?: string;
    };

    if (!name || !addressLine1 || !city || !state || !postalCode || !country) {
      validationErrorResponse(res, ['Missing required address fields']);
      return;
    }

    const address = await SupplierAddressRepo.create({
      supplierId,
      name,
      addressLine1,
      addressLine2: (req.body as { addressLine2?: string }).addressLine2,
      city,
      state,
      postalCode,
      country,
      addressType: (addressType as SupplierAddressType) || 'headquarters',
      isDefault: isDefault || false,
      contactName,
      contactEmail,
      contactPhone,
      notes,
      isActive: true,
    });

    successResponse(res, address, 201);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to create supplier address');
  }
};

export const updateSupplierAddress = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { supplierAddressId } = req.params;
    const address = await SupplierAddressRepo.update(supplierAddressId, req.body as SupplierAddressUpdateParams);

    if (!address) {
      errorResponse(res, 'Supplier address not found', 404);
      return;
    }

    successResponse(res, address);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update supplier address');
  }
};

export const deleteSupplierAddress = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { supplierAddressId } = req.params;
    const deleted = await SupplierAddressRepo.delete(supplierAddressId);

    if (!deleted) {
      errorResponse(res, 'Supplier address not found', 404);
      return;
    }

    successResponse(res, { message: 'Supplier address deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to delete supplier address');
  }
};

// ---------- Supplier Product Methods ----------

export const getSupplierProducts = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;
    const products = await SupplierProductRepo.findBySupplierId(supplierId);
    successResponse(res, products);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch supplier products');
  }
};

export const addProductToSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;
    const { productId, productVariantId, sku, supplierSku, supplierProductName, isPreferred, unitCost, currency, minimumOrderQuantity, leadTime, packagingInfo, dimensions, weight, notes } = req.body as {
      productId: string;
      productVariantId?: string;
      sku: string;
      supplierSku?: string;
      supplierProductName?: string;
      isPreferred?: boolean;
      unitCost: number;
      currency?: string;
      minimumOrderQuantity?: number;
      leadTime?: number;
      packagingInfo?: Record<string, unknown>;
      dimensions?: Record<string, unknown>;
      weight?: number;
      notes?: string;
    };

    if (!productId || !sku || unitCost === undefined) {
      validationErrorResponse(res, ['Missing required fields: productId, sku, unitCost']);
      return;
    }

    const supplierProduct = await SupplierProductRepo.create({
      supplierId,
      productId,
      productVariantId,
      sku,
      supplierSku,
      supplierProductName,
      status: 'active',
      isPreferred: isPreferred || false,
      unitCost,
      currency: currency || 'USD',
      minimumOrderQuantity: minimumOrderQuantity || 1,
      leadTime,
      packagingInfo,
      dimensions,
      weight,
      notes,
    });

    successResponse(res, supplierProduct, 201);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to add product to supplier');
  }
};

export const updateSupplierProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { supplierProductId } = req.params;
    const product = await SupplierProductRepo.update(supplierProductId, req.body as SupplierProductUpdateParams);

    if (!product) {
      errorResponse(res, 'Supplier product not found', 404);
      return;
    }

    successResponse(res, product);
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update supplier product');
  }
};

export const removeProductFromSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { supplierProductId } = req.params;
    const deleted = await SupplierProductRepo.delete(supplierProductId);

    if (!deleted) {
      errorResponse(res, 'Supplier product not found', 404);
      return;
    }

    successResponse(res, { message: 'Product removed from supplier successfully' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to remove product from supplier');
  }
};
