import { jsonResponse } from "libs/apiResponse";
import type { HttpRequest, HttpResponse } from 'libs/http';
import { TaxRate, TaxCategory } from '../../taxTypes';
import type { CreateTaxRateRecordCommand } from '../../application/useCases/CreateTaxRateRecord';
import type { CreateTaxCategoryCommand } from '../../application/useCases/CreateTaxCategory';
import type { CreateTaxZoneCommand } from '../../application/useCases/CreateTaxZone';
import type { UpdateTaxZoneCommand } from '../../application/useCases/UpdateTaxZone';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import {
  manageTaxRecordsUseCase,
  createTaxRateRecordUseCase,
  createTaxCategoryUseCase,
  createTaxZoneUseCase,
  updateTaxZoneUseCase,
} from '../../application/wired';
import { isUuid } from '../../../../libs/uuid';

export const getTaxRate = async (req: HttpRequest, res: HttpResponse) => {
  const { id } = req.params;

  if (!id) {
    return jsonResponse(res, 400, { success: false, error: 'Tax rate ID is required' });
  }
  if (!isUuid(id)) {
    return jsonResponse(res, 404, { success: false, error: 'Tax rate not found' });
  }

  const taxRate = await manageTaxRecordsUseCase.findTaxRateById(id);

  if (!taxRate) {
    return jsonResponse(res, 404, { success: false, error: 'Tax rate not found' });
  }

  jsonResponse(res, 200, { success: true, data: taxRate });
};

export const getAllTaxRates = async (req: HttpRequest, res: HttpResponse) => {
  const { country, region, status, limit, offset } = req.query;
  const limitNum = limit ? parseInt(limit as string) : undefined;
  const offsetNum = offset ? parseInt(offset as string) : undefined;

  // Convert status string to boolean if needed
  let statusFilter: boolean | undefined = undefined;
  if (status === 'active') {
    statusFilter = true;
  } else if (status === 'inactive') {
    statusFilter = false;
  }

  const taxRates = await manageTaxRecordsUseCase.findAllTaxRates(statusFilter, country as string, region as string, limitNum, offsetNum);

  jsonResponse(res, 200, { success: true, data: taxRates });
};

export const createTaxRate = async (req: HttpRequest, res: HttpResponse) => {
  try {
    const createdTaxRate = await createTaxRateRecordUseCase.execute(req.body as CreateTaxRateRecordCommand);
    jsonResponse(res, 201, { success: true, data: createdTaxRate });
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { success: false, error: getErrorMessage(error) });
  }
};

export const updateTaxRate = async (req: HttpRequest, res: HttpResponse) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return jsonResponse(res, 404, { success: false, error: 'Tax rate not found' });
  }
  const body = req.body as {
    name?: string;
    description?: string;
    rate?: string | number;
    taxCategoryId?: string;
    taxZoneId?: string;
    priority?: string | number;
    isActive?: boolean;
  };
  const { name, description, rate, taxCategoryId, taxZoneId, priority, isActive } = body;

  const existingTaxRate = await manageTaxRecordsUseCase.findTaxRateById(id);

  if (!existingTaxRate) {
    return jsonResponse(res, 404, { success: false, error: 'Tax rate not found' });
  }

  const updatedTaxRate: Partial<Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>> = {};

  if (name !== undefined) updatedTaxRate.name = name;
  if (description !== undefined) updatedTaxRate.description = description;
  if (rate !== undefined) updatedTaxRate.rate = parseFloat(String(rate));
  if (taxCategoryId !== undefined) updatedTaxRate.taxCategoryId = taxCategoryId;
  if (taxZoneId !== undefined) updatedTaxRate.taxZoneId = taxZoneId;
  if (priority !== undefined) updatedTaxRate.priority = parseInt(String(priority));
  if (isActive !== undefined) updatedTaxRate.isActive = isActive;

  const result = await manageTaxRecordsUseCase.updateTaxRate(id, updatedTaxRate);

  jsonResponse(res, 200, { success: true, data: result });
};

export const deleteTaxRate = async (req: HttpRequest, res: HttpResponse) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return jsonResponse(res, 404, { success: false, error: 'Tax rate not found' });
  }

  const existingTaxRate = await manageTaxRecordsUseCase.findTaxRateById(id);

  if (!existingTaxRate) {
    return jsonResponse(res, 404, { success: false, error: 'Tax rate not found' });
  }

  await manageTaxRecordsUseCase.deleteTaxRate(id);

  jsonResponse(res, 200, { success: true, message: 'Tax rate deleted successfully' });
};

// Tax Category Methods
export const getAllTaxCategories = async (req: HttpRequest, res: HttpResponse) => {
  const { status } = req.query;

  // Convert status string to boolean if needed
  let isActive: boolean | undefined = undefined;
  if (status === 'active') {
    isActive = true;
  } else if (status === 'inactive') {
    isActive = false;
  }

  const taxCategories = await manageTaxRecordsUseCase.findAllTaxCategories(isActive);

  jsonResponse(res, 200, { success: true, data: taxCategories });
};

export const getTaxCategory = async (req: HttpRequest, res: HttpResponse) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return jsonResponse(res, 404, { success: false, error: 'Tax category not found' });
  }
  const taxCategory = await manageTaxRecordsUseCase.findTaxCategoryById(id);

  if (!taxCategory) {
    return jsonResponse(res, 404, { success: false, error: 'Tax category not found' });
  }

  jsonResponse(res, 200, { success: true, data: taxCategory });
};

export const createTaxCategory = async (req: HttpRequest, res: HttpResponse) => {
  try {
    const createdCategory = await createTaxCategoryUseCase.execute(req.body as CreateTaxCategoryCommand);
    jsonResponse(res, 201, { success: true, data: createdCategory });
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { success: false, error: getErrorMessage(error) });
  }
};

export const updateTaxCategory = async (req: HttpRequest, res: HttpResponse) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return jsonResponse(res, 404, { success: false, error: 'Tax category not found' });
  }
  const body = req.body as {
    name?: string;
    code?: string;
    description?: string;
    isDefault?: boolean;
    sortOrder?: string;
    isActive?: boolean;
  };
  const { name, code, description, isDefault, sortOrder, isActive } = body;

  const existingCategory = await manageTaxRecordsUseCase.findTaxCategoryById(id);

  if (!existingCategory) {
    return jsonResponse(res, 404, { success: false, error: 'Tax category not found' });
  }

  const updatedCategory: Partial<Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>> = {};

  if (name !== undefined) updatedCategory.name = name;
  if (code !== undefined) updatedCategory.code = code;
  if (description !== undefined) updatedCategory.description = description;
  if (isDefault !== undefined) updatedCategory.isDefault = isDefault;
  if (sortOrder !== undefined) updatedCategory.sortOrder = parseInt(sortOrder);
  if (isActive !== undefined) updatedCategory.isActive = isActive;

  const result = await manageTaxRecordsUseCase.updateTaxCategory(id, updatedCategory);

  jsonResponse(res, 200, { success: true, data: result });
};

export const deleteTaxCategory = async (req: HttpRequest, res: HttpResponse) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return jsonResponse(res, 404, { success: false, error: 'Tax category not found' });
  }

  const existingCategory = await manageTaxRecordsUseCase.findTaxCategoryById(id);

  if (!existingCategory) {
    return jsonResponse(res, 404, { success: false, error: 'Tax category not found' });
  }

  await manageTaxRecordsUseCase.deleteTaxCategory(id);

  jsonResponse(res, 200, { success: true, message: 'Tax category deleted successfully' });
};

// Tax Zone Methods
export const getAllTaxZones = async (req: HttpRequest, res: HttpResponse) => {
  const { status, limit, offset } = req.query;
  const limitNum = limit ? parseInt(limit as string) : undefined;
  const offsetNum = offset ? parseInt(offset as string) : undefined;

  let statusFilter: boolean | undefined = undefined;
  if (status === 'active') {
    statusFilter = true;
  } else if (status === 'inactive') {
    statusFilter = false;
  }

  const taxZones = await manageTaxRecordsUseCase.findAllTaxZones(statusFilter, limitNum, offsetNum);

  jsonResponse(res, 200, { success: true, data: taxZones });
};

export const getTaxZoneById = async (req: HttpRequest, res: HttpResponse) => {
  const { id } = req.params;

  if (!id) {
    return jsonResponse(res, 400, { success: false, error: 'Tax zone ID is required' });
  }

  const taxZone = await manageTaxRecordsUseCase.findTaxZoneById(id);

  if (!taxZone) {
    return jsonResponse(res, 404, { success: false, error: 'Tax zone not found' });
  }

  jsonResponse(res, 200, { success: true, data: taxZone });
};

export const createTaxZone = async (req: HttpRequest, res: HttpResponse) => {
  try {
    const createdTaxZone = await createTaxZoneUseCase.execute(req.body as CreateTaxZoneCommand);
    jsonResponse(res, 201, { success: true, data: createdTaxZone });
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { success: false, error: getErrorMessage(error) });
  }
};

export const updateTaxZone = async (req: HttpRequest, res: HttpResponse) => {
  const { id } = req.params;

  try {
    const result = await updateTaxZoneUseCase.execute(id, req.body as UpdateTaxZoneCommand);
    jsonResponse(res, 200, { success: true, data: result });
  } catch (error: unknown) {
    jsonResponse(res, getErrorStatusCode(error), { success: false, error: getErrorMessage(error) });
  }
};

export const deleteTaxZone = async (req: HttpRequest, res: HttpResponse) => {
  const { id } = req.params;

  const existingTaxZone = await manageTaxRecordsUseCase.findTaxZoneById(id);

  if (!existingTaxZone) {
    return jsonResponse(res, 404, { success: false, error: 'Tax zone not found' });
  }

  await manageTaxRecordsUseCase.deleteTaxZone(id);

  jsonResponse(res, 200, { success: true, message: 'Tax zone deleted successfully' });
};
