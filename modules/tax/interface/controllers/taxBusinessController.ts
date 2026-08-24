import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import taxQueryRepository from '../../infrastructure/repositories/TaxQueryRepository';
import taxCommandRepository from '../../infrastructure/repositories/TaxCommandRepository';
import { TaxRate, TaxCategory, TaxZone, TaxRateType } from '../../taxTypes';

export const getTaxRate = async (req: TypedRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Tax rate ID is required' });
  }

  const taxRate = await taxQueryRepository.query.findTaxRateById(id);

  if (!taxRate) {
    return res.status(404).json({ success: false, error: 'Tax rate not found' });
  }

  res.json({ success: true, data: taxRate });
  
};

export const getAllTaxRates = async (req: TypedRequest, res: Response) => {
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

  const taxRates = await taxQueryRepository.query.findAllTaxRates(statusFilter, country as string, region as string, limitNum, offsetNum);

  res.json({ success: true, data: taxRates });
  
};

export const createTaxRate = async (req: TypedRequest, res: Response) => {
  const body = req.body as {
    name?: string;
    description?: string;
    rate?: string | number;
    taxCategoryId?: string;
    taxZoneId?: string;
    priority?: string | number;
    isActive?: boolean;
    type?: string;
    isCompound?: boolean;
    includeInPrice?: boolean;
    isShippingTaxable?: boolean;
    startDate?: number;
  };

  const { name, description, rate, taxCategoryId, taxZoneId, priority, isActive, type, isCompound, includeInPrice, isShippingTaxable, startDate } = body;

  if (!name || rate === undefined || !taxCategoryId || !taxZoneId) {
    return res.status(400).json({
      success: false,
      error: 'Name, rate, tax category ID, and tax zone ID are required',
    });
  }

  const newTaxRate: Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'> = {
    name,
    description,
    rate: parseFloat(String(rate)),
    taxCategoryId,
    taxZoneId,
    priority: priority ? parseInt(String(priority)) : 1,
    isActive: isActive !== undefined ? isActive : true,
    type: (type || 'percentage') as TaxRateType,
    isCompound: isCompound !== undefined ? isCompound : false,
    includeInPrice: includeInPrice !== undefined ? includeInPrice : false,
    isShippingTaxable: isShippingTaxable !== undefined ? isShippingTaxable : false,
    startDate: startDate || Math.floor(Date.now() / 1000), // Unix timestamp if not provided
  };

  const createdTaxRate = await taxCommandRepository.commands.createTaxRate(newTaxRate);

  res.status(201).json({ success: true, data: createdTaxRate });
  
};

export const updateTaxRate = async (req: TypedRequest, res: Response) => {
  const { id } = req.params;
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

  const existingTaxRate = await taxQueryRepository.query.findTaxRateById(id);

  if (!existingTaxRate) {
    return res.status(404).json({ success: false, error: 'Tax rate not found' });
  }

  const updatedTaxRate: Partial<Omit<TaxRate, 'id' | 'createdAt' | 'updatedAt'>> = {};

  if (name !== undefined) updatedTaxRate.name = name;
  if (description !== undefined) updatedTaxRate.description = description;
  if (rate !== undefined) updatedTaxRate.rate = parseFloat(String(rate));
  if (taxCategoryId !== undefined) updatedTaxRate.taxCategoryId = taxCategoryId;
  if (taxZoneId !== undefined) updatedTaxRate.taxZoneId = taxZoneId;
  if (priority !== undefined) updatedTaxRate.priority = parseInt(String(priority));
  if (isActive !== undefined) updatedTaxRate.isActive = isActive;

  const result = await taxCommandRepository.commands.updateTaxRate(id, updatedTaxRate);

  res.json({ success: true, data: result });
  
};

export const deleteTaxRate = async (req: TypedRequest, res: Response) => {
  const { id } = req.params;

  const existingTaxRate = await taxQueryRepository.query.findTaxRateById(id);

  if (!existingTaxRate) {
    return res.status(404).json({ success: false, error: 'Tax rate not found' });
  }

  await taxCommandRepository.commands.deleteTaxRate(id);

  res.json({ success: true, message: 'Tax rate deleted successfully' });
  
};

// Tax Category Methods
export const getAllTaxCategories = async (req: TypedRequest, res: Response) => {
  const { status } = req.query;

  // Convert status string to boolean if needed
  let isActive: boolean | undefined = undefined;
  if (status === 'active') {
    isActive = true;
  } else if (status === 'inactive') {
    isActive = false;
  }

  const taxCategories = await taxQueryRepository.query.findAllTaxCategories(isActive);

  res.json({ success: true, data: taxCategories });
  
};

export const getTaxCategory = async (req: TypedRequest, res: Response) => {
  const { id } = req.params;
  const taxCategory = await taxQueryRepository.query.findTaxCategoryById(id);

  if (!taxCategory) {
    return res.status(404).json({ success: false, error: 'Tax category not found' });
  }

  res.json({ success: true, data: taxCategory });
  
};

export const createTaxCategory = async (req: TypedRequest, res: Response) => {
  const body = req.body as {
    name?: string;
    code?: string;
    description?: string;
    isDefault?: boolean;
    sortOrder?: string;
    isActive?: boolean;
  };
  const { name, code, description, isDefault, sortOrder, isActive } = body;

  if (!name || !code) {
    return res.status(400).json({ success: false, error: 'Name and code are required' });
  }

  const newTaxCategory = {
    name,
    code,
    description,
    isDefault: isDefault !== undefined ? isDefault : false,
    sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
    isActive: isActive !== undefined ? isActive : true,
  };

  const createdCategory = await taxCommandRepository.commands.createTaxCategory(newTaxCategory);

  res.status(201).json({ success: true, data: createdCategory });
  
};

export const updateTaxCategory = async (req: TypedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body as {
    name?: string;
    code?: string;
    description?: string;
    isDefault?: boolean;
    sortOrder?: string;
    isActive?: boolean;
  };
  const { name, code, description, isDefault, sortOrder, isActive } = body;

  const existingCategory = await taxQueryRepository.query.findTaxCategoryById(id);

  if (!existingCategory) {
    return res.status(404).json({ success: false, error: 'Tax category not found' });
  }

  const updatedCategory: Partial<Omit<TaxCategory, 'id' | 'createdAt' | 'updatedAt'>> = {};

  if (name !== undefined) updatedCategory.name = name;
  if (code !== undefined) updatedCategory.code = code;
  if (description !== undefined) updatedCategory.description = description;
  if (isDefault !== undefined) updatedCategory.isDefault = isDefault;
  if (sortOrder !== undefined) updatedCategory.sortOrder = parseInt(sortOrder);
  if (isActive !== undefined) updatedCategory.isActive = isActive;

  const result = await taxCommandRepository.commands.updateTaxCategory(id, updatedCategory);

  res.json({ success: true, data: result });
  
};

export const deleteTaxCategory = async (req: TypedRequest, res: Response) => {
  const { id } = req.params;

  const existingCategory = await taxQueryRepository.query.findTaxCategoryById(id);

  if (!existingCategory) {
    return res.status(404).json({ success: false, error: 'Tax category not found' });
  }

  await taxCommandRepository.commands.deleteTaxCategory(id);

  res.json({ success: true, message: 'Tax category deleted successfully' });
  
};

// Tax Zone Methods
export const getAllTaxZones = async (req: TypedRequest, res: Response) => {
  const { status, limit, offset } = req.query;
  const limitNum = limit ? parseInt(limit as string) : undefined;
  const offsetNum = offset ? parseInt(offset as string) : undefined;

  let statusFilter: boolean | undefined = undefined;
  if (status === 'active') {
    statusFilter = true;
  } else if (status === 'inactive') {
    statusFilter = false;
  }

  const taxZones = await taxQueryRepository.query.findAllTaxZones(statusFilter, limitNum, offsetNum);

  res.json({ success: true, data: taxZones });
  
};

export const getTaxZoneById = async (req: TypedRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Tax zone ID is required' });
  }

  const taxZone = await taxQueryRepository.query.findTaxZoneById(id);

  if (!taxZone) {
    return res.status(404).json({ success: false, error: 'Tax zone not found' });
  }

  res.json({ success: true, data: taxZone });
  
};

export const createTaxZone = async (req: TypedRequest, res: Response) => {
  const body = req.body as {
    name?: string;
    code?: string;
    description?: string;
    isDefault?: boolean;
    countries?: string[];
    states?: string[];
    postcodes?: string[];
    cities?: string[];
    isActive?: boolean;
  };
  const { name, code, description, isDefault, countries, states, postcodes, cities, isActive } = body;

  if (!name || !code || !countries || !Array.isArray(countries) || countries.length === 0) {
    return res.status(400).json({ success: false, error: 'Name, code, and at least one country are required' });
  }

  const newTaxZone = {
    name,
    code,
    description,
    isDefault: isDefault !== undefined ? isDefault : false,
    countries,
    states: states || [],
    postcodes: postcodes || [],
    cities: cities || [],
    isActive: isActive !== undefined ? isActive : true,
  };

  const createdTaxZone = await taxCommandRepository.commands.createTaxZone(newTaxZone);

  res.status(201).json({ success: true, data: createdTaxZone });
  
};

export const updateTaxZone = async (req: TypedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body as {
    name?: string;
    code?: string;
    description?: string;
    isDefault?: boolean;
    countries?: string[];
    states?: string[];
    postcodes?: string[];
    cities?: string[];
    isActive?: boolean;
  };
  const { name, code, description, isDefault, countries, states, postcodes, cities, isActive } = body;

  const existingTaxZone = await taxQueryRepository.query.findTaxZoneById(id);

  if (!existingTaxZone) {
    return res.status(404).json({ success: false, error: 'Tax zone not found' });
  }

  const updatedTaxZone: Partial<Omit<TaxZone, 'id' | 'createdAt' | 'updatedAt'>> = {};

  if (name !== undefined) updatedTaxZone.name = name;
  if (code !== undefined) updatedTaxZone.code = code;
  if (description !== undefined) updatedTaxZone.description = description;
  if (isDefault !== undefined) updatedTaxZone.isDefault = isDefault;
  if (countries !== undefined) {
    if (!Array.isArray(countries) || countries.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one country is required' });
    }
    updatedTaxZone.countries = countries;
  }
  if (states !== undefined) updatedTaxZone.states = states;
  if (postcodes !== undefined) updatedTaxZone.postcodes = postcodes;
  if (cities !== undefined) updatedTaxZone.cities = cities;
  if (isActive !== undefined) updatedTaxZone.isActive = isActive;

  const result = await taxCommandRepository.commands.updateTaxZone(id, updatedTaxZone);

  res.json({ success: true, data: result });
  
};

export const deleteTaxZone = async (req: TypedRequest, res: Response) => {
  const { id } = req.params;

  const existingTaxZone = await taxQueryRepository.query.findTaxZoneById(id);

  if (!existingTaxZone) {
    return res.status(404).json({ success: false, error: 'Tax zone not found' });
  }

  await taxCommandRepository.commands.deleteTaxZone(id);

  res.json({ success: true, message: 'Tax zone deleted successfully' });
  
};
