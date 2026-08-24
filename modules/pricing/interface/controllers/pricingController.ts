import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import pricingRuleRepository from '../../infrastructure/repositories/PricingRuleRepository';
import pricingDataRepository from '../../infrastructure/repositories/PricingDataRepository';
import { CustomerPriceList, CustomerPrice, PricingRuleCreateProps, PricingRuleStatus, PricingRuleUpdateProps, TierPrice } from '../../domain/pricingRule';

interface PricingRuleBody {
  name?: string;
  type?: string;
  scope?: string;
  adjustments?: { type: string; value: number }[];
  [key: string]: unknown;
}

interface TierPriceBody {
  productId?: string;
  quantityMin?: number;
  price?: number;
  [key: string]: unknown;
}

interface PriceListBody {
  name?: string;
  [key: string]: unknown;
}

interface PriceBody {
  productId?: string;
  adjustmentType?: string;
  adjustmentValue?: number;
  priceListId?: string;
  [key: string]: unknown;
}

/**
 * Get all pricing rules with pagination and filtering
 */
export const getPricingRules = async (req: TypedRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status, scope, type, productId, categoryId, customerId, customerGroupId, _search } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  // Get rules and total count using separate repo methods
  const filters = {
    status: status as PricingRuleStatus,
    scope: scope as string,
    type: type as string,
    productId: productId as string,
    categoryId: categoryId as string,
    customerId: customerId as string,
    customerGroupId: customerGroupId as string,
    // Note: search isn't supported in the repo method based on its definition
  };

  // Get the rules with proper pagination (offset based on page number)
  const rules = await pricingRuleRepository.rules.findAllRules(filters, {
    limit: limitNum,
    offset: (pageNum - 1) * limitNum, // Convert page to offset
  });

  // Get the total count for pagination
  const total = await pricingRuleRepository.rules.countRules(filters);

  res.json({
    success: true,
    data: { rules, total },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
  
};

/**
 * Get a pricing rule by ID
 */
export const getPricingRule = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const rule = await pricingRuleRepository.rules.findById(id);

  if (!rule) {
    res.status(404).json({
      success: false,
      message: 'Pricing rule not found',
    });
    return;
  }

  res.json({
    success: true,
    data: rule,
  });
  
};

/**
 * Create a new pricing rule
 */
export const createPricingRule = async (req: TypedRequest<Record<string, string>, unknown, PricingRuleBody>, res: Response): Promise<void> => {
  const ruleData = req.body;

  // Validate required fields
  if (!ruleData.name || !ruleData.type || !ruleData.scope) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields: name, type, and scope are required',
    });
    return;
  }

  // Validate adjustments
  if (!ruleData.adjustments || ruleData.adjustments.length === 0) {
    res.status(400).json({
      success: false,
      message: 'At least one adjustment is required',
    });
    return;
  }

  const newRule = await pricingRuleRepository.rules.create(ruleData as PricingRuleCreateProps);

  res.status(201).json({
    success: true,
    data: newRule,
  });
  
};

/**
 * Update a pricing rule
 */
export const updatePricingRule = async (req: TypedRequest<Record<string, string>, unknown, PricingRuleBody>, res: Response): Promise<void> => {
  const { id } = req.params;
  const ruleData = req.body;

  const existingRule = await pricingRuleRepository.rules.findById(id);
  if (!existingRule) {
    res.status(404).json({
      success: false,
      message: 'Pricing rule not found',
    });
    return;
  }

  const updatedRule = await pricingRuleRepository.rules.update(id, ruleData as PricingRuleUpdateProps);

  res.json({
    success: true,
    data: updatedRule,
  });
  
};

/**
 * Delete a pricing rule
 */
export const deletePricingRule = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const existingRule = await pricingRuleRepository.rules.findById(id);
  if (!existingRule) {
    res.status(404).json({
      success: false,
      message: 'Pricing rule not found',
    });
    return;
  }

  await pricingRuleRepository.rules.delete(id);

  res.json({
    success: true,
    message: 'Pricing rule deleted successfully',
  });
  
};

/**
 * Get tier prices with pagination and filtering
 */
export const getTierPrices = async (req: TypedRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', productId, variantId, customerGroupId } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const { tierPrices, total } = await pricingDataRepository.tierPrices.findAll({
    page: pageNum,
    limit: limitNum,
    productId: productId as string,
    variantId: variantId as string,
    customerGroupId: customerGroupId as string,
  });

  res.json({
    success: true,
    data: tierPrices,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
  
};

/**
 * Get a tier price by ID
 */
export const getTierPrice = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const tierPrice = await pricingDataRepository.tierPrices.findById(id);

  if (!tierPrice) {
    res.status(404).json({
      success: false,
      message: 'Tier price not found',
    });
    return;
  }

  res.json({
    success: true,
    data: tierPrice,
  });
  
};

/**
 * Create a new tier price
 */
export const createTierPrice = async (req: TypedRequest<Record<string, string>, unknown, TierPriceBody>, res: Response): Promise<void> => {
  const tierPriceData = req.body;

  // Validate required fields
  if (!tierPriceData.productId || !tierPriceData.quantityMin || !tierPriceData.price) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields: productId, quantityMin, and price are required',
    });
    return;
  }

  const newTierPrice = await pricingDataRepository.tierPrices.create(tierPriceData as Omit<TierPrice, 'id' | 'createdAt' | 'updatedAt'>);

  res.status(201).json({
    success: true,
    data: newTierPrice,
  });
  
};

/**
 * Update a tier price
 */
export const updateTierPrice = async (req: TypedRequest<Record<string, string>, unknown, TierPriceBody>, res: Response): Promise<void> => {
  const { id } = req.params;
  const tierPriceData = req.body;

  const existingTierPrice = await pricingDataRepository.tierPrices.findById(id);
  if (!existingTierPrice) {
    res.status(404).json({
      success: false,
      message: 'Tier price not found',
    });
    return;
  }

  const updatedTierPrice = await pricingDataRepository.tierPrices.update(id, tierPriceData as Partial<Omit<TierPrice, 'id' | 'createdAt' | 'updatedAt'>>);

  res.json({
    success: true,
    data: updatedTierPrice,
  });
  
};

/**
 * Delete a tier price
 */
export const deleteTierPrice = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const existingTierPrice = await pricingDataRepository.tierPrices.findById(id);
  if (!existingTierPrice) {
    res.status(404).json({
      success: false,
      message: 'Tier price not found',
    });
    return;
  }

  await pricingDataRepository.tierPrices.delete(id);

  res.json({
    success: true,
    message: 'Tier price deleted successfully',
  });
  
};

/**
 * Get customer price lists with pagination and filtering
 */
export const getPriceLists = async (req: TypedRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', customerId, customerGroupId, _status } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  // For now, retrieve price lists directly (implement pagination in repo if needed)
  let priceLists: CustomerPriceList[];

  if (customerId) {
    const customerGroupIds = customerGroupId ? [customerGroupId as string] : [];
    priceLists = await pricingDataRepository.customerPrices.findPriceListsForCustomer(customerId as string, customerGroupIds);
  } else {
    // This would need to be implemented in the repo
    // For now, return an empty array
    priceLists = [];
  }

  res.json({
    success: true,
    data: priceLists,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: priceLists.length,
      pages: Math.ceil(priceLists.length / limitNum),
    },
  });
  
};

/**
 * Get a price list by ID
 */
export const getPriceList = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const priceList = await pricingDataRepository.customerPrices.findPriceListById(id);

  if (!priceList) {
    res.status(404).json({
      success: false,
      message: 'Price list not found',
    });
    return;
  }

  // Get associated prices
  const prices = await pricingDataRepository.customerPrices.findPricesByPriceListId(id);

  res.json({
    success: true,
    data: {
      ...priceList,
      prices,
    },
  });
  
};

/**
 * Create a new price list
 */
export const createPriceList = async (req: TypedRequest<Record<string, string>, unknown, PriceListBody>, res: Response): Promise<void> => {
  const priceListData = req.body;

  // Validate required fields
  if (!priceListData.name) {
    res.status(400).json({
      success: false,
      message: 'Missing required field: name is required',
    });
    return;
  }

  const newPriceList = await pricingDataRepository.customerPrices.createPriceList(priceListData as Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>);

  res.status(201).json({
    success: true,
    data: newPriceList,
  });
  
};

/**
 * Update a price list
 */
export const updatePriceList = async (req: TypedRequest<Record<string, string>, unknown, PriceListBody>, res: Response): Promise<void> => {
  const { id } = req.params;
  const priceListData = req.body;

  const existingPriceList = await pricingDataRepository.customerPrices.findPriceListById(id);
  if (!existingPriceList) {
    res.status(404).json({
      success: false,
      message: 'Price list not found',
    });
    return;
  }

  const updatedPriceList = await pricingDataRepository.customerPrices.updatePriceList(id, priceListData as Partial<Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>>);

  res.json({
    success: true,
    data: updatedPriceList,
  });
  
};

/**
 * Delete a price list
 */
export const deletePriceList = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const existingPriceList = await pricingDataRepository.customerPrices.findPriceListById(id);
  if (!existingPriceList) {
    res.status(404).json({
      success: false,
      message: 'Price list not found',
    });
    return;
  }

  await pricingDataRepository.customerPrices.deletePriceList(id);

  res.json({
    success: true,
    message: 'Price list deleted successfully',
  });
  
};

/**
 * Add a price to a price list
 */
export const addPriceToList = async (req: TypedRequest<Record<string, string>, unknown, PriceBody>, res: Response): Promise<void> => {
  const { priceListId } = req.params;
  const priceData = req.body;

  // Validate price list exists
  const existingPriceList = await pricingDataRepository.customerPrices.findPriceListById(priceListId);
  if (!existingPriceList) {
    res.status(404).json({
      success: false,
      message: 'Price list not found',
    });
    return;
  }

  // Validate required fields
  if (!priceData.productId || !priceData.adjustmentType || priceData.adjustmentValue === undefined) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields: productId, adjustmentType, and adjustmentValue are required',
    });
    return;
  }

  const newPrice = await pricingDataRepository.customerPrices.createPrice({
    ...priceData,
    priceListId,
  } as Omit<CustomerPrice, 'id' | 'createdAt' | 'updatedAt'>);

  res.status(201).json({
    success: true,
    data: newPrice,
  });
  
};
