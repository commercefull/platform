import { Request, Response } from "express";
import pricingRuleRepo from "../repos/pricingRuleRepo";
import tierPriceRepo from "../repos/tierPriceRepo";
import customerPriceRepo from "../repos/customerPriceRepo";
import { CustomerPriceList, PricingRuleStatus } from "../domain/pricingRule";

/**
 * Get all pricing rules with pagination and filtering
 */
export const getPricingRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "20",
      status,
      scope,
      type,
      productId,
      categoryId,
      customerId,
      customerGroupId,
      search,
    } = req.query;

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
    const rules = await pricingRuleRepo.findAllRules(filters, {
      limit: limitNum,
      offset: (pageNum - 1) * limitNum  // Convert page to offset
    });

    // Get the total count for pagination
    const total = await pricingRuleRepo.countRules(filters);

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
  } catch (error) {
    console.error("Error getting pricing rules:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pricing rules",
      error: (error as Error).message,
    });
  }
}

/**
 * Get a pricing rule by ID
 */
export const getPricingRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const rule = await pricingRuleRepo.findById(id);

    if (!rule) {
      res.status(404).json({
        success: false,
        message: "Pricing rule not found",
      });
      return;
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("Error getting pricing rule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pricing rule",
      error: (error as Error).message,
    });
  }
}

/**
 * Create a new pricing rule
 */
export const createPricingRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const ruleData = req.body;

    // Validate required fields
    if (!ruleData.name || !ruleData.type || !ruleData.scope) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: name, type, and scope are required",
      });
      return;
    }

    // Validate adjustments
    if (!ruleData.adjustments || ruleData.adjustments.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one adjustment is required",
      });
      return;
    }

    const newRule = await pricingRuleRepo.create(ruleData);

    res.status(201).json({
      success: true,
      data: newRule,
    });
  } catch (error) {
    console.error("Error creating pricing rule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create pricing rule",
      error: (error as Error).message,
    });
  }
}

/**
 * Update a pricing rule
 */
export const updatePricingRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ruleData = req.body;

    const existingRule = await pricingRuleRepo.findById(id);
    if (!existingRule) {
      res.status(404).json({
        success: false,
        message: "Pricing rule not found",
      });
      return;
    }

    const updatedRule = await pricingRuleRepo.update(id, ruleData);

    res.json({
      success: true,
      data: updatedRule,
    });
  } catch (error) {
    console.error("Error updating pricing rule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update pricing rule",
      error: (error as Error).message,
    });
  }
}

/**
 * Delete a pricing rule
 */
export const deletePricingRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingRule = await pricingRuleRepo.findById(id);
    if (!existingRule) {
      res.status(404).json({
        success: false,
        message: "Pricing rule not found",
      });
      return;
    }

    await pricingRuleRepo.delete(id);

    res.json({
      success: true,
      message: "Pricing rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pricing rule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete pricing rule",
      error: (error as Error).message,
    });
  }
}

/**
 * Get tier prices with pagination and filtering
 */
export const getTierPrices = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "20",
      productId,
      variantId,
      customerGroupId,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const { tierPrices, total } = await tierPriceRepo.findAll({
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
  } catch (error) {
    console.error("Error getting tier prices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get tier prices",
      error: (error as Error).message,
    });
  }
}

/**
 * Get a tier price by ID
 */
export const getTierPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tierPrice = await tierPriceRepo.findById(id);

    if (!tierPrice) {
      res.status(404).json({
        success: false,
        message: "Tier price not found",
      });
      return;
    }

    res.json({
      success: true,
      data: tierPrice,
    });
  } catch (error) {
    console.error("Error getting tier price:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get tier price",
      error: (error as Error).message,
    });
  }
}

/**
 * Create a new tier price
 */
export const createTierPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const tierPriceData = req.body;

    // Validate required fields
    if (!tierPriceData.productId || !tierPriceData.quantityMin || !tierPriceData.price) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: productId, quantityMin, and price are required",
      });
      return;
    }

    const newTierPrice = await tierPriceRepo.create(tierPriceData);

    res.status(201).json({
      success: true,
      data: newTierPrice,
    });
  } catch (error) {
    console.error("Error creating tier price:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create tier price",
      error: (error as Error).message,
    });
  }
}

/**
 * Update a tier price
 */
export const updateTierPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tierPriceData = req.body;

    const existingTierPrice = await tierPriceRepo.findById(id);
    if (!existingTierPrice) {
      res.status(404).json({
        success: false,
        message: "Tier price not found",
      });
      return;
    }

    const updatedTierPrice = await tierPriceRepo.update(id, tierPriceData);

    res.json({
      success: true,
      data: updatedTierPrice,
    });
  } catch (error) {
    console.error("Error updating tier price:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tier price",
      error: (error as Error).message,
    });
  }
}

/**
 * Delete a tier price
 */
export const deleteTierPrice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingTierPrice = await tierPriceRepo.findById(id);
    if (!existingTierPrice) {
      res.status(404).json({
        success: false,
        message: "Tier price not found",
      });
      return;
    }

    await tierPriceRepo.delete(id);

    res.json({
      success: true,
      message: "Tier price deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tier price:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tier price",
      error: (error as Error).message,
    });
  }
}

/**
 * Get customer price lists with pagination and filtering
 */
export const getPriceLists = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "20",
      customerId,
      customerGroupId,
      status,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // For now, retrieve price lists directly (implement pagination in repo if needed)
    let priceLists: CustomerPriceList[] = [];

    if (customerId) {
      const customerGroupIds = customerGroupId ? [customerGroupId as string] : [];
      priceLists = await customerPriceRepo.findPriceListsForCustomer(
        customerId as string,
        customerGroupIds
      );
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
  } catch (error) {
    console.error("Error getting price lists:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get price lists",
      error: (error as Error).message,
    });
  }
}

/**
 * Get a price list by ID
 */
export const getPriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const priceList = await customerPriceRepo.findPriceListById(id);

    if (!priceList) {
      res.status(404).json({
        success: false,
        message: "Price list not found",
      });
      return;
    }

    // Get associated prices
    const prices = await customerPriceRepo.findPricesByPriceListId(id);

    res.json({
      success: true,
      data: {
        ...priceList,
        prices,
      },
    });
  } catch (error) {
    console.error("Error getting price list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get price list",
      error: (error as Error).message,
    });
  }
}

/**
 * Create a new price list
 */
export const createPriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    const priceListData = req.body;

    // Validate required fields
    if (!priceListData.name) {
      res.status(400).json({
        success: false,
        message: "Missing required field: name is required",
      });
      return;
    }

    const newPriceList = await customerPriceRepo.createPriceList(priceListData);

    res.status(201).json({
      success: true,
      data: newPriceList,
    });
  } catch (error) {
    console.error("Error creating price list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create price list",
      error: (error as Error).message,
    });
  }
}

/**
 * Update a price list
 */
export const updatePriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const priceListData = req.body;

    const existingPriceList = await customerPriceRepo.findPriceListById(id);
    if (!existingPriceList) {
      res.status(404).json({
        success: false,
        message: "Price list not found",
      });
      return;
    }

    const updatedPriceList = await customerPriceRepo.updatePriceList(id, priceListData);

    res.json({
      success: true,
      data: updatedPriceList,
    });
  } catch (error) {
    console.error("Error updating price list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update price list",
      error: (error as Error).message,
    });
  }
}

/**
 * Delete a price list
 */
export const deletePriceList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingPriceList = await customerPriceRepo.findPriceListById(id);
    if (!existingPriceList) {
      res.status(404).json({
        success: false,
        message: "Price list not found",
      });
      return;
    }

    await customerPriceRepo.deletePriceList(id);

    res.json({
      success: true,
      message: "Price list deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting price list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete price list",
      error: (error as Error).message,
    });
  }
}

/**
 * Add a price to a price list
 */
export const addPriceToList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { priceListId } = req.params;
    const priceData = req.body;

    // Validate price list exists
    const existingPriceList = await customerPriceRepo.findPriceListById(priceListId);
    if (!existingPriceList) {
      res.status(404).json({
        success: false,
        message: "Price list not found",
      });
      return;
    }

    // Validate required fields
    if (!priceData.productId || !priceData.adjustmentType || priceData.adjustmentValue === undefined) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: productId, adjustmentType, and adjustmentValue are required",
      });
      return;
    }

    const newPrice = await customerPriceRepo.createPrice({
      ...priceData,
      priceListId,
    });

    res.status(201).json({
      success: true,
      data: newPrice,
    });
  } catch (error) {
    console.error("Error adding price to list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add price to list",
      error: (error as Error).message,
    });
  }
}
