import type { HttpRequest, HttpResponse } from 'libs/http';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import {
  CustomerPriceList,
  PricingRuleCreateProps,
  PricingRuleStatus,
  PricingRuleUpdateProps,
  TierPrice,
} from '../../domain/pricingRule';
import {
  managePricingAdminUseCase,
  createPricingRuleUseCase,
  createTierPriceUseCase,
  addPriceToListUseCase,
} from '../../application/wired';
import type { CustomerPriceCreateProps } from '../../application/useCases/AddPriceToList';
import type { TierPriceCreateProps } from '../../application/useCases/CreateTierPrice';

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
  priceCents?: number;
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
export const getPricingRules = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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
  const rules = await managePricingAdminUseCase.findAllRules(filters, {
    limit: limitNum,
    offset: (pageNum - 1) * limitNum, // Convert page to offset
  });

  // Get the total count for pagination
  const total = await managePricingAdminUseCase.countRules(filters);

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
export const getPricingRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const rule = await managePricingAdminUseCase.findRuleById(id);

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
export const createPricingRule = async (
  req: HttpRequest<Record<string, string>, unknown, PricingRuleBody>,
  res: HttpResponse,
): Promise<void> => {
  try {
    const newRule = await createPricingRuleUseCase.execute(req.body as PricingRuleCreateProps);

    res.status(201).json({
      success: true,
      data: newRule,
    });
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Update a pricing rule
 */
export const updatePricingRule = async (
  req: HttpRequest<Record<string, string>, unknown, PricingRuleBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const ruleData = req.body;

  const existingRule = await managePricingAdminUseCase.findRuleById(id);
  if (!existingRule) {
    res.status(404).json({
      success: false,
      message: 'Pricing rule not found',
    });
    return;
  }

  const updatedRule = await managePricingAdminUseCase.updateRule(id, ruleData as PricingRuleUpdateProps);

  res.json({
    success: true,
    data: updatedRule,
  });
};

/**
 * Delete a pricing rule
 */
export const deletePricingRule = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  const existingRule = await managePricingAdminUseCase.findRuleById(id);
  if (!existingRule) {
    res.status(404).json({
      success: false,
      message: 'Pricing rule not found',
    });
    return;
  }

  await managePricingAdminUseCase.deleteRule(id);

  res.json({
    success: true,
    message: 'Pricing rule deleted successfully',
  });
};

/**
 * Get tier prices with pagination and filtering
 */
export const getTierPrices = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { page = '1', limit = '20', productId, variantId, customerGroupId } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const { tierPrices, total } = await managePricingAdminUseCase.findTierPrices({
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
export const getTierPrice = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const tierPrice = await managePricingAdminUseCase.findTierPriceById(id);

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
export const createTierPrice = async (
  req: HttpRequest<Record<string, string>, unknown, TierPriceBody>,
  res: HttpResponse,
): Promise<void> => {
  try {
    const newTierPrice = await createTierPriceUseCase.execute(req.body as TierPriceCreateProps);

    res.status(201).json({
      success: true,
      data: newTierPrice,
    });
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Update a tier price
 */
export const updateTierPrice = async (
  req: HttpRequest<Record<string, string>, unknown, TierPriceBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const tierPriceData = req.body;

  const existingTierPrice = await managePricingAdminUseCase.findTierPriceById(id);
  if (!existingTierPrice) {
    res.status(404).json({
      success: false,
      message: 'Tier price not found',
    });
    return;
  }

  const updatedTierPrice = await managePricingAdminUseCase.updateTierPrice(
    id,
    tierPriceData as Partial<Omit<TierPrice, 'id' | 'createdAt' | 'updatedAt'>>,
  );

  res.json({
    success: true,
    data: updatedTierPrice,
  });
};

/**
 * Delete a tier price
 */
export const deleteTierPrice = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  const existingTierPrice = await managePricingAdminUseCase.findTierPriceById(id);
  if (!existingTierPrice) {
    res.status(404).json({
      success: false,
      message: 'Tier price not found',
    });
    return;
  }

  await managePricingAdminUseCase.deleteTierPrice(id);

  res.json({
    success: true,
    message: 'Tier price deleted successfully',
  });
};

/**
 * Get customer price lists with pagination and filtering
 */
export const getPriceLists = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { page = '1', limit = '20', customerId, customerGroupId, _status } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  // For now, retrieve price lists directly (implement pagination in repo if needed)
  let priceLists: CustomerPriceList[];

  if (customerId) {
    const customerGroupIds = customerGroupId ? [customerGroupId as string] : [];
    priceLists = await managePricingAdminUseCase.findPriceListsForCustomer(customerId as string, customerGroupIds);
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
export const getPriceList = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const priceList = await managePricingAdminUseCase.findPriceListById(id);

  if (!priceList) {
    res.status(404).json({
      success: false,
      message: 'Price list not found',
    });
    return;
  }

  // Get associated prices
  const prices = await managePricingAdminUseCase.findPricesByPriceListId(id);

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
export const createPriceList = async (
  req: HttpRequest<Record<string, string>, unknown, PriceListBody>,
  res: HttpResponse,
): Promise<void> => {
  const priceListData = req.body;

  // Validate required fields
  if (!priceListData.name) {
    res.status(400).json({
      success: false,
      message: 'Missing required field: name is required',
    });
    return;
  }

  const newPriceList = await managePricingAdminUseCase.createCustomerPriceList(
    priceListData as Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>,
  );

  res.status(201).json({
    success: true,
    data: newPriceList,
  });
};

/**
 * Update a price list
 */
export const updatePriceList = async (
  req: HttpRequest<Record<string, string>, unknown, PriceListBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const priceListData = req.body;

  const existingPriceList = await managePricingAdminUseCase.findPriceListById(id);
  if (!existingPriceList) {
    res.status(404).json({
      success: false,
      message: 'Price list not found',
    });
    return;
  }

  const updatedPriceList = await managePricingAdminUseCase.updateCustomerPriceList(
    id,
    priceListData as Partial<Omit<CustomerPriceList, 'id' | 'createdAt' | 'updatedAt'>>,
  );

  res.json({
    success: true,
    data: updatedPriceList,
  });
};

/**
 * Delete a price list
 */
export const deletePriceList = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  const existingPriceList = await managePricingAdminUseCase.findPriceListById(id);
  if (!existingPriceList) {
    res.status(404).json({
      success: false,
      message: 'Price list not found',
    });
    return;
  }

  await managePricingAdminUseCase.deleteCustomerPriceList(id);

  res.json({
    success: true,
    message: 'Price list deleted successfully',
  });
};

/**
 * Add a price to a price list
 */
export const addPriceToList = async (req: HttpRequest<Record<string, string>, unknown, PriceBody>, res: HttpResponse): Promise<void> => {
  const { priceListId } = req.params;

  try {
    const newPrice = await addPriceToListUseCase.execute(
      priceListId,
      req.body as Omit<CustomerPriceCreateProps, 'priceListId'>,
    );

    res.status(201).json({
      success: true,
      data: newPrice,
    });
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};
