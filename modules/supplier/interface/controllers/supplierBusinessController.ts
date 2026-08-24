import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import supplierDataRepository from '../../infrastructure/repositories/SupplierDataRepository';
import type { SupplierFilters, SupplierStatus, SupplierCreateParams, SupplierUpdateParams, SupplierAddressType, SupplierAddressUpdateParams, SupplierProductUpdateParams } from '../../infrastructure/repositories/SupplierDataRepository';
import { successResponse, errorResponse, validationErrorResponse } from '../../../../libs/apiResponse';

const supplierRepo = supplierDataRepository.suppliers;
const SupplierAddressRepo = supplierDataRepository.addresses;
const SupplierProductRepo = supplierDataRepository.products;

export const getSuppliers = async (req: TypedRequest, res: Response): Promise<void> => {
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
};

export const getSupplierById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const supplier = await supplierRepo.findById(id);

  if (!supplier) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const getSupplierByCode = async (req: TypedRequest, res: Response): Promise<void> => {
  const { code } = req.params;
  const supplier = await supplierRepo.findByCode(code);

  if (!supplier) {
    errorResponse(res, `Supplier with code ${code} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const createSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
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
};

export const updateSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updateParams = req.body as SupplierUpdateParams;

  const supplier = await supplierRepo.update(id, updateParams);

  if (!supplier) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const deleteSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = await supplierRepo.delete(id);

  if (!deleted) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, { message: 'Supplier deleted successfully' });
};

export const updateSupplierStatus = async (req: TypedRequest, res: Response): Promise<void> => {
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
};

export const updateSupplierVisibility = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isVisible } = req.body as { isVisible?: boolean };

  if (isVisible === undefined) {
    validationErrorResponse(res, ['isVisible is required']);
    return;
  }

  const supplier = await supplierRepo.update(id, { isActive: isVisible });

  if (!supplier) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const approveSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const supplier = await supplierRepo.approve(id);

  if (!supplier) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const suspendSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const supplier = await supplierRepo.suspend(id);

  if (!supplier) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const getSupplierStatistics = async (req: TypedRequest, res: Response): Promise<void> => {
  const statistics = await supplierRepo.getStatistics();
  successResponse(res, statistics);
};

// ---------- Supplier Address Methods ----------

export const getSupplierAddresses = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id: supplierId } = req.params;
  const addresses = await SupplierAddressRepo.findBySupplierId(supplierId);
  successResponse(res, addresses);
};

export const createSupplierAddress = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id: supplierId } = req.params;
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
};

export const updateSupplierAddress = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id: supplierAddressId } = req.params;
  const address = await SupplierAddressRepo.update(supplierAddressId, req.body as SupplierAddressUpdateParams);

  if (!address) {
    errorResponse(res, 'Supplier address not found', 404);
    return;
  }

  successResponse(res, address);
};

export const deleteSupplierAddress = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id: supplierAddressId } = req.params;
  const deleted = await SupplierAddressRepo.delete(supplierAddressId);

  if (!deleted) {
    errorResponse(res, 'Supplier address not found', 404);
    return;
  }

  successResponse(res, { message: 'Supplier address deleted successfully' });
};

// ---------- Supplier Product Methods ----------

export const getSupplierProducts = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id: supplierId } = req.params;
  const products = await SupplierProductRepo.findBySupplierId(supplierId);
  successResponse(res, products);
};

export const addProductToSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id: supplierId } = req.params;
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
};

export const updateSupplierProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id: supplierProductId } = req.params;
  const product = await SupplierProductRepo.update(supplierProductId, req.body as SupplierProductUpdateParams);

  if (!product) {
    errorResponse(res, 'Supplier product not found', 404);
    return;
  }

  successResponse(res, product);
};

export const removeProductFromSupplier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id: supplierProductId } = req.params;
  const deleted = await SupplierProductRepo.delete(supplierProductId);

  if (!deleted) {
    errorResponse(res, 'Supplier product not found', 404);
    return;
  }

  successResponse(res, { message: 'Product removed from supplier successfully' });
};
