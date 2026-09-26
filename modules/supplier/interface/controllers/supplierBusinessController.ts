import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse, validationErrorResponse } from '../../../../libs/apiResponse';
import { manageSupplierDirectoryUseCase } from '../../application/wired';
import { SupplierValidationError } from '../../domain/errors/SupplierErrors';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';
import {
  SupplierFilters,
  SupplierStatus,
  SupplierCreateParams,
  SupplierUpdateParams,
  SupplierAddressUpdateParams,
  SupplierProductUpdateParams,
} from '../../application/wired';

function respondValidation(res: HttpResponse, error: unknown, fallbackStatus = 400): void {
  if (error instanceof SupplierValidationError) {
    validationErrorResponse(res, getErrorMessage(error).split('; '));
    return;
  }
  res.status(getErrorStatusCode(error) || fallbackStatus).json({ success: false, message: getErrorMessage(error) });
}

export const getSuppliers = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { status, isActive, isApproved, minRating, category, tag, currency, search, limit = '50', offset = '0' } = req.query;

  const filters: SupplierFilters = {};
  if (status) filters.status = status as SupplierStatus;
  if (isActive !== undefined) filters.isActive = isActive === 'true';
  if (isApproved !== undefined) filters.isApproved = isApproved === 'true';
  if (minRating) filters.minRating = parseFloat(minRating as string);
  if (category) filters.category = category as string;
  if (tag) filters.tag = tag as string;
  if (currency) filters.currency = currency as string;

  const suppliers = await manageSupplierDirectoryUseCase.listSuppliers({
    search: search as string | undefined,
    filters: filters as Record<string, unknown>,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });

  successResponse(res, suppliers);
};

export const getSupplierById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const supplier = await manageSupplierDirectoryUseCase.getSupplierById(id);

  if (!supplier) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const getSupplierByCode = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { code } = req.params;
  const supplier = await manageSupplierDirectoryUseCase.getSupplierByCode(code);

  if (!supplier) {
    errorResponse(res, `Supplier with code ${code} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const createSupplier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
    minOrderValueCents,
    leadTime,
    notes,
    categories,
    tags,
    customFields,
  } = req.body as SupplierCreateParams & { currency?: string };

  try {
    const supplier = await manageSupplierDirectoryUseCase.createSupplier({
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
      minOrderValueCents,
      leadTime,
      notes,
      categories,
      tags,
      customFields,
    });
    successResponse(res, supplier, 201);
  } catch (error) {
    if (error instanceof SupplierValidationError) {
      validationErrorResponse(res, getErrorMessage(error).split('; '));
      return;
    }
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const updateSupplier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const updateParams = req.body as SupplierUpdateParams;

  const supplier = await manageSupplierDirectoryUseCase.updateSupplier(id, updateParams as Record<string, unknown>);

  if (!supplier) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const deleteSupplier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const deleted = await manageSupplierDirectoryUseCase.deleteSupplier(id);

  if (!deleted) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, { message: 'Supplier deleted successfully' });
};

export const updateSupplierStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body as { status?: SupplierStatus };

  try {
    const supplier = await manageSupplierDirectoryUseCase.updateSupplierStatus(id, status);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error) {
    respondValidation(res, error);
  }
};

export const updateSupplierVisibility = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const { isVisible } = req.body as { isVisible?: boolean };

  try {
    const supplier = await manageSupplierDirectoryUseCase.setSupplierVisibility(id, isVisible);

    if (!supplier) {
      errorResponse(res, `Supplier with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, supplier);
  } catch (error) {
    respondValidation(res, error);
  }
};

export const approveSupplier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const supplier = await manageSupplierDirectoryUseCase.approveSupplier(id);

  if (!supplier) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const suspendSupplier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const supplier = await manageSupplierDirectoryUseCase.suspendSupplier(id);

  if (!supplier) {
    errorResponse(res, `Supplier with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, supplier);
};

export const getSupplierStatistics = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const statistics = await manageSupplierDirectoryUseCase.getStatistics();
  successResponse(res, statistics);
};

// ---------- Supplier Address Methods ----------

export const getSupplierAddresses = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id: supplierId } = req.params;
  const addresses = await manageSupplierDirectoryUseCase.listAddresses(supplierId);
  successResponse(res, addresses);
};

export const createSupplierAddress = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id: supplierId } = req.params;
  const { name, addressLine1, city, state, postalCode, country, addressType, isDefault, contactName, contactEmail, contactPhone, notes } =
    req.body as {
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

  try {
    const address = await manageSupplierDirectoryUseCase.createAddress({
      supplierId,
      name,
      addressLine1,
      addressLine2: (req.body as { addressLine2?: string }).addressLine2,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefault,
      contactName,
      contactEmail,
      contactPhone,
      notes,
    });
    successResponse(res, address, 201);
  } catch (error) {
    if (error instanceof SupplierValidationError) {
      validationErrorResponse(res, getErrorMessage(error).split('; '));
      return;
    }
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const updateSupplierAddress = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id: supplierAddressId } = req.params;
  const address = await manageSupplierDirectoryUseCase.updateAddress(
    supplierAddressId,
    req.body as SupplierAddressUpdateParams as Record<string, unknown>,
  );

  if (!address) {
    errorResponse(res, 'Supplier address not found', 404);
    return;
  }

  successResponse(res, address);
};

export const deleteSupplierAddress = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id: supplierAddressId } = req.params;
  const deleted = await manageSupplierDirectoryUseCase.deleteAddress(supplierAddressId);

  if (!deleted) {
    errorResponse(res, 'Supplier address not found', 404);
    return;
  }

  successResponse(res, { message: 'Supplier address deleted successfully' });
};

// ---------- Supplier Product Methods ----------

export const getSupplierProducts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id: supplierId } = req.params;
  const products = await manageSupplierDirectoryUseCase.listProducts(supplierId);
  successResponse(res, products);
};

export const addProductToSupplier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id: supplierId } = req.params;
  const {
    productId,
    productVariantId,
    sku,
    supplierSku,
    supplierProductName,
    isPreferred,
    unitCostCents,
    currency,
    minimumOrderQuantity,
    leadTime,
    packagingInfo,
    dimensions,
    weight,
    notes,
  } = req.body as {
    productId: string;
    productVariantId?: string;
    sku: string;
    supplierSku?: string;
    supplierProductName?: string;
    isPreferred?: boolean;
    unitCostCents: number;
    currency?: string;
    minimumOrderQuantity?: number;
    leadTime?: number;
    packagingInfo?: Record<string, unknown>;
    dimensions?: Record<string, unknown>;
    weight?: number;
    notes?: string;
  };

  try {
    const supplierProduct = await manageSupplierDirectoryUseCase.addProduct({
      supplierId,
      productId,
      productVariantId,
      sku,
      supplierSku,
      supplierProductName,
      isPreferred,
      unitCostCents,
      currency,
      minimumOrderQuantity,
      leadTime,
      packagingInfo,
      dimensions,
      weight,
      notes,
    });
    successResponse(res, supplierProduct, 201);
  } catch (error) {
    if (error instanceof SupplierValidationError) {
      validationErrorResponse(res, getErrorMessage(error).split('; '));
      return;
    }
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const updateSupplierProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id: supplierProductId } = req.params;
  const product = await manageSupplierDirectoryUseCase.updateProduct(
    supplierProductId,
    req.body as SupplierProductUpdateParams as Record<string, unknown>,
  );

  if (!product) {
    errorResponse(res, 'Supplier product not found', 404);
    return;
  }

  successResponse(res, product);
};

export const removeProductFromSupplier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id: supplierProductId } = req.params;
  const deleted = await manageSupplierDirectoryUseCase.deleteProduct(supplierProductId);

  if (!deleted) {
    errorResponse(res, 'Supplier product not found', 404);
    return;
  }

  successResponse(res, { message: 'Product removed from supplier successfully' });
};
