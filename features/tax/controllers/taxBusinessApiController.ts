import { Request, Response } from 'express';
import taxQueryRepo from '../repos/taxQueryRepo';
import { TaxCommandRepo } from '../repos/taxCommandRepo';
import {
  TaxRate,
  TaxCategory,
  TaxZone
} from '../taxTypes';

export const getTaxRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Tax rate ID is required' });
    }

    const taxRate = await taxQueryRepo.findTaxRateById(id);

    if (!taxRate) {
      res.status(404).json({ error: 'Tax rate not found' });
    }

    res.json(taxRate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getAllTaxRates = async (req: Request, res: Response) => {
  try {
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

    const taxRates = await taxQueryRepo.findAllTaxRates(
      statusFilter,
      country as string,
      region as string,
      limitNum,
      offsetNum
    );

    res.json(taxRates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const createTaxRate = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      rate,
      taxCategoryId,
      taxZoneId,
      priority,
      isActive,
      type,
      isCompound,
      includeInPrice,
      isShippingTaxable,
      startDate
    } = req.body;

    if (!name || rate === undefined || !taxCategoryId || !taxZoneId) {
      res.status(400).json({
        error: 'Name, rate, tax category ID, and tax zone ID are required'
      });
    }

    const newTaxRate = {
      name,
      description,
      rate: parseFloat(rate),
      taxCategoryId,
      taxZoneId,
      priority: priority ? parseInt(priority) : 1,
      isActive: isActive !== undefined ? isActive : true,
      type: type || 'percentage',
      isCompound: isCompound !== undefined ? isCompound : false,
      includeInPrice: includeInPrice !== undefined ? includeInPrice : false,
      isShippingTaxable: isShippingTaxable !== undefined ? isShippingTaxable : false,
      startDate: startDate || Math.floor(Date.now() / 1000) // Unix timestamp if not provided
    };

    const createdTaxRate = await (new TaxCommandRepo()).createTaxRate(newTaxRate);

    res.status(201).json(createdTaxRate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const updateTaxRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      rate,
      taxCategoryId,
      taxZoneId,
      priority,
      isActive
    } = req.body;

    const existingTaxRate = await taxQueryRepo.findTaxRateById(id);

    if (!existingTaxRate) {
      res.status(404).json({ error: 'Tax rate not found' });
    }

    const updatedTaxRate: Partial<Omit<TaxRate, "id" | "createdAt" | "updatedAt">> = {};

    if (name !== undefined) updatedTaxRate.name = name;
    if (description !== undefined) updatedTaxRate.description = description;
    if (rate !== undefined) updatedTaxRate.rate = parseFloat(rate);
    if (taxCategoryId !== undefined) updatedTaxRate.taxCategoryId = taxCategoryId;
    if (taxZoneId !== undefined) updatedTaxRate.taxZoneId = taxZoneId;
    if (priority !== undefined) updatedTaxRate.priority = parseInt(priority);
    if (isActive !== undefined) updatedTaxRate.isActive = isActive;

    const result = await (new TaxCommandRepo()).updateTaxRate(id, updatedTaxRate);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const deleteTaxRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTaxRate = await taxQueryRepo.findTaxRateById(id);

    if (!existingTaxRate) {
      res.status(404).json({ error: 'Tax rate not found' });
    }

    await (new TaxCommandRepo()).deleteTaxRate(id);

    res.json({ message: 'Tax rate deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Tax Category Methods
export const getAllTaxCategories = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    // Convert status string to boolean if needed
    let isActive: boolean | undefined = undefined;
    if (status === 'active') {
      isActive = true;
    } else if (status === 'inactive') {
      isActive = false;
    }

    const taxCategories = await taxQueryRepo.findAllTaxCategories(isActive);

    res.json(taxCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const getTaxCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const taxCategory = await taxQueryRepo.findTaxCategoryById(id);

    if (!taxCategory) {
      res.status(404).json({ error: 'Tax category not found' });
    }

    res.json(taxCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const createTaxCategory = async (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      description,
      isDefault,
      sortOrder,
      isActive
    } = req.body;

    if (!name || !code) {
      res.status(400).json({ error: 'Name and code are required' });
    }

    const newTaxCategory = {
      name,
      code,
      description,
      isDefault: isDefault !== undefined ? isDefault : false,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
      isActive: isActive !== undefined ? isActive : true
    };

    const createdCategory = await (new TaxCommandRepo()).createTaxCategory(newTaxCategory);

    res.status(201).json(createdCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const updateTaxCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      description,
      isDefault,
      sortOrder,
      isActive
    } = req.body;

    const existingCategory = await taxQueryRepo.findTaxCategoryById(id);

    if (!existingCategory) {
      res.status(404).json({ error: 'Tax category not found' });
    }

    const updatedCategory: Partial<Omit<TaxCategory, "id" | "createdAt" | "updatedAt">> = {};

    if (name !== undefined) updatedCategory.name = name;
    if (code !== undefined) updatedCategory.code = code;
    if (description !== undefined) updatedCategory.description = description;
    if (isDefault !== undefined) updatedCategory.isDefault = isDefault;
    if (sortOrder !== undefined) updatedCategory.sortOrder = parseInt(sortOrder);
    if (isActive !== undefined) updatedCategory.isActive = isActive;

    const result = await (new TaxCommandRepo()).updateTaxCategory(id, updatedCategory);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const deleteTaxCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingCategory = await taxQueryRepo.findTaxCategoryById(id);

    if (!existingCategory) {
      res.status(404).json({ error: 'Tax category not found' });
    }

    await (new TaxCommandRepo()).deleteTaxCategory(id);

    res.json({ message: 'Tax category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Tax Zone Methods
export const getTaxZoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Tax zone ID is required' });
    }

    const taxZone = await taxQueryRepo.findTaxZoneById(id);

    if (!taxZone) {
      res.status(404).json({ error: 'Tax zone not found' });
    }

    res.json(taxZone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const createTaxZone = async (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      description,
      isDefault,
      countries,
      states,
      postcodes,
      cities,
      isActive
    } = req.body;

    if (!name || !code || !countries || !Array.isArray(countries) || countries.length === 0) {
      res.status(400).json({ error: 'Name, code, and at least one country are required' });
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
      isActive: isActive !== undefined ? isActive : true
    };

    const createdTaxZone = await (new TaxCommandRepo()).createTaxZone(newTaxZone);

    res.status(201).json(createdTaxZone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const updateTaxZone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      description,
      isDefault,
      countries,
      states,
      postcodes,
      cities,
      isActive
    } = req.body;

    const existingTaxZone = await taxQueryRepo.findTaxZoneById(id);

    if (!existingTaxZone) {
      res.status(404).json({ error: 'Tax zone not found' });
    }

    const updatedTaxZone: Partial<Omit<TaxZone, "id" | "createdAt" | "updatedAt">> = {};

    if (name !== undefined) updatedTaxZone.name = name;
    if (code !== undefined) updatedTaxZone.code = code;
    if (description !== undefined) updatedTaxZone.description = description;
    if (isDefault !== undefined) updatedTaxZone.isDefault = isDefault;
    if (countries !== undefined) {
      if (!Array.isArray(countries) || countries.length === 0) {
        res.status(400).json({ error: 'At least one country is required' });
      }
      updatedTaxZone.countries = countries;
    }
    if (states !== undefined) updatedTaxZone.states = states;
    if (postcodes !== undefined) updatedTaxZone.postcodes = postcodes;
    if (cities !== undefined) updatedTaxZone.cities = cities;
    if (isActive !== undefined) updatedTaxZone.isActive = isActive;

    const result = await (new TaxCommandRepo()).updateTaxZone(id, updatedTaxZone);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const deleteTaxZone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTaxZone = await taxQueryRepo.findTaxZoneById(id);

    if (!existingTaxZone) {
      res.status(404).json({ error: 'Tax zone not found' });
    }

    await (new TaxCommandRepo()).deleteTaxZone(id);

    res.json({ message: 'Tax zone deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
