import { Request, Response } from 'express';
import { DistributionRepo } from '../repos/distributionRepo';
import { DistributionWarehouse, DistributionShippingMethod, DistributionShippingZone } from '../../../libs/db/types';

// Create a single instance of the repo to be used by all functions
const distributionRepo = new DistributionRepo();

/**
 * Get active distribution centers with limited information
 */
export const getActiveDistributionCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const centers = await distributionRepo.findActiveWarehouses();
    
    // Return limited public information
    const publicCenters = centers.map((center: DistributionWarehouse) => ({
      id: center.distributionWarehouseId,
      name: center.name,
      city: center.city,
      state: center.state,
      country: center.country
    }));
    
    res.status(200).json({
      success: true,
      data: publicCenters
    });
  } catch (error) {
    console.error('Error fetching active distribution centers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution centers'
    });
  }
};

/**
 * Get active shipping methods with public information
 */
export const getActiveShippingMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const methods = await distributionRepo.findActiveShippingMethods();
    
    // Return limited public information
    const publicMethods = methods.map((method: DistributionShippingMethod) => ({
      id: method.distributionShippingMethodId,
      name: method.name,
      code: method.code,
      domesticInternational: method.domesticInternational,
      estimatedDeliveryDays: method.estimatedDeliveryDays
    }));
    
    res.status(200).json({
      success: true,
      data: publicMethods
    });
  } catch (error) {
    console.error('Error fetching active shipping methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping methods'
    });
  }
};

/**
 * Get shipping methods available for a specific address
 */
export const getAvailableShippingMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { country, region, postalCode } = req.query;
    
    if (!country) {
      res.status(400).json({
        success: false,
        message: 'Country is required'
      });
      return;
    }
    
    // Find all active shipping zones
    const zones = await distributionRepo.findActiveShippingZones();
    
    // Find matching zones based on address
    const matchingZones = zones.filter((zone: DistributionShippingZone) => {
      const locations = (zone.locations || []) as string[];
      const countryMatch = locations.includes(country as string);
      // Basic match on country only for now; extend as needed for regions/postal codes using locations content
      return countryMatch;
    });
    
    // If no matching zones, return default shipping methods
    if (matchingZones.length === 0) {
      const defaultRule = await distributionRepo.findDefaultDistributionRule();
      
      if (!defaultRule) {
        res.status(404).json({
          success: false,
          message: 'No shipping options available for this address'
        });
        return;
      }
      
      const defaultMethod = await distributionRepo.findShippingMethodById(defaultRule.distributionShippingMethodId!);
      
      if (!defaultMethod) {
        res.status(404).json({
          success: false,
          message: 'No shipping options available for this address'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: [{
          id: defaultMethod.distributionShippingMethodId,
          name: defaultMethod.name,
          code: defaultMethod.code,
          domesticInternational: defaultMethod.domesticInternational,
          estimatedDeliveryDays: defaultMethod.estimatedDeliveryDays
        }]
      });
      return;
    }
    
    // Get rules for matching zones
    const zoneIds = matchingZones.map((zone: DistributionShippingZone) => zone.distributionShippingZoneId);
    const availableMethods = [];
    
    // For each zone, get the applicable rules and their shipping methods
    for (const zoneId of zoneIds) {
      const rules = await distributionRepo.findDistributionRulesByZone(zoneId);
      
      for (const rule of rules) {
        const method = await distributionRepo.findShippingMethodById(rule.distributionShippingMethodId!);
        
        if (method && method.isActive) {
          availableMethods.push({
            id: method.distributionShippingMethodId,
            name: method.name,
            code: method.code,
            domesticInternational: method.domesticInternational,
            estimatedDeliveryDays: method.estimatedDeliveryDays
          });
        }
      }
    }
    
    // Remove duplicates based on ID
    const uniqueMethods = availableMethods.filter((method, index, self) => 
      index === self.findIndex(m => m.id === method.id)
    );
    
    res.status(200).json({
      success: true,
      data: uniqueMethods
    });
  } catch (error) {
    console.error('Error fetching available shipping methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping methods'
    });
  }
};

/**
 * Get tracking information for an order
 */
export const getOrderTracking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    
    const fulfillments = await distributionRepo.findOrderFulfillmentsByOrderId(orderId);
    
    if (fulfillments.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No tracking information found for this order'
      });
      return;
    }
    
    // Return tracking info with limited details
    const trackingInfo = fulfillments.map(fulfillment => {
      // Get shipping method name
      let methodName = '';
      // Ideally we'd look up the method name here, but we'll simplify for now
      
      return {
        status: fulfillment.status,
        trackingNumber: fulfillment.trackingNumber,
        trackingUrl: fulfillment.trackingUrl,
        shippingMethod: methodName,
        shippedAt: fulfillment.shippedAt,
        deliveredAt: fulfillment.deliveredAt
      };
    });
    
    res.status(200).json({
      success: true,
      data: trackingInfo
    });
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tracking information'
    });
  }
};
