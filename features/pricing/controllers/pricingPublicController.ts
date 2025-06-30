import { Request, Response } from "express";
import pricingService from "../services/pricingService";
import { PriceContext } from "../domain/pricingRule";

export class PricingPublicController {
  /**
   * Get price for a product with all applicable pricing rules
   */
  async getProductPrice(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { 
        variantId, 
        quantity = "1",
        customerId,
        customerGroupIds,
        applyLoyaltyDiscount,
        loyaltyPointsToApply,
      } = req.query;

      // Parse numeric values
      const quantityNum = parseInt(quantity as string, 10);
      let loyaltyPointsNum: number | undefined;
      
      if (loyaltyPointsToApply) {
        loyaltyPointsNum = parseInt(loyaltyPointsToApply as string, 10);
      }

      // Parse array values
      let customerGroupIdsArray: string[] = [];
      if (customerGroupIds) {
        if (Array.isArray(customerGroupIds)) {
          customerGroupIdsArray = customerGroupIds as string[];
        } else {
          customerGroupIdsArray = [customerGroupIds as string];
        }
      }
      
      // Build price context
      const context: PriceContext = {
        variantId: variantId as string,
        customerId: customerId as string,
        customerGroupIds: customerGroupIdsArray,
        quantity: quantityNum,
        additionalData: {
          applyLoyaltyDiscount: applyLoyaltyDiscount === 'true',
          loyaltyPointsToApply: loyaltyPointsNum,
        }
      };
      
      const priceResult = await pricingService.calculatePrice(productId, context);
      
      res.json({
        success: true,
        data: priceResult,
      });
    } catch (error) {
      console.error("Error getting product price:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get product price",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get prices for multiple products in a single call
   */
  async getBulkPrices(req: Request, res: Response): Promise<void> {
    try {
      const { items, ...contextData } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: "Items array is required and cannot be empty",
        });
        return;
      }
      
      // Extract common context data
      const { 
        customerId, 
        customerGroupIds = [],
        applyLoyaltyDiscount,
        loyaltyPointsToApply,
      } = contextData;
      
      // Build context for the pricing service
      const context: Omit<PriceContext, 'quantity'> = {
        customerId,
        customerGroupIds,
        additionalData: {
          applyLoyaltyDiscount: !!applyLoyaltyDiscount,
          loyaltyPointsToApply,
        }
      };
      
      const priceResults = await pricingService.calculatePrices(items, context);
      
      res.json({
        success: true,
        data: priceResults,
      });
    } catch (error) {
      console.error("Error getting bulk prices:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get bulk prices",
        error: (error as Error).message,
      });
    }
  }
  
  /**
   * Calculate price with a specific rule to preview its effect
   */
  async previewRuleEffect(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId, productId } = req.params;
      const { 
        variantId, 
        quantity = "1",
        customerId,
        customerGroupIds,
      } = req.query;
      
      // Parse numeric values
      const quantityNum = parseInt(quantity as string, 10);
      
      // Parse array values
      let customerGroupIdsArray: string[] = [];
      if (customerGroupIds) {
        if (Array.isArray(customerGroupIds)) {
          customerGroupIdsArray = customerGroupIds as string[];
        } else {
          customerGroupIdsArray = [customerGroupIds as string];
        }
      }
      
      // Build price context
      const context: PriceContext = {
        variantId: variantId as string,
        customerId: customerId as string,
        customerGroupIds: customerGroupIdsArray,
        quantity: quantityNum,
      };
      
      const ruleImpact = await pricingService.calculateRuleImpact(ruleId, productId, context);
      
      res.json({
        success: true,
        data: ruleImpact,
      });
    } catch (error) {
      console.error("Error previewing rule effect:", error);
      res.status(500).json({
        success: false,
        message: "Failed to preview rule effect",
        error: (error as Error).message,
      });
    }
  }
}

export default new PricingPublicController();
