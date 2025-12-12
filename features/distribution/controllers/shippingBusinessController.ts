/**
 * Shipping Business Controller
 * Handles admin/merchant operations for shipping zones, methods, carriers, and rates
 */
import { Request, Response } from 'express';
import * as shippingRepo from '../repos/shippingRepo';
import { calculateShippingRate } from '../useCases/shipping/CalculateShippingRate';
import { getAvailableShippingMethods } from '../useCases/shipping/GetAvailableShippingMethods';

// =============================================================================
// Shipping Zones
// =============================================================================

export const getShippingZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, offset } = req.query;
    const result = await shippingRepo.findAllShippingZones({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    res.status(200).json({
      success: true,
      data: result.zones,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping zones'
    });
  }
};

export const getActiveShippingZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const zones = await shippingRepo.findActiveShippingZones();
    res.status(200).json({
      success: true,
      data: zones
    });
  } catch (error) {
    console.error('Error fetching active shipping zones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active shipping zones'
    });
  }
};

export const getShippingZoneById = async (req: Request, res: Response): Promise<void> => {
  try {
    const zone = await shippingRepo.findShippingZoneById(req.params.id);
    
    if (!zone) {
      res.status(404).json({
        success: false,
        message: 'Shipping zone not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: zone
    });
  } catch (error) {
    console.error('Error fetching shipping zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping zone'
    });
  }
};

export const createShippingZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, locationType, locations, excludedLocations, isActive, priority } = req.body;
    
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Name is required'
      });
      return;
    }
    
    const zone = await shippingRepo.createShippingZone({
      name,
      description: description || null,
      locationType: locationType || 'country',
      locations: Array.isArray(locations) ? locations : [],
      excludedLocations: Array.isArray(excludedLocations) ? excludedLocations : null,
      isActive: isActive !== false,
      priority: priority || 0,
      createdBy: (req as any).user?.id || null
    });
    
    res.status(201).json({
      success: true,
      data: zone,
      message: 'Shipping zone created successfully'
    });
  } catch (error) {
    console.error('Error creating shipping zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shipping zone'
    });
  }
};

export const updateShippingZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingZone = await shippingRepo.findShippingZoneById(id);
    if (!existingZone) {
      res.status(404).json({
        success: false,
        message: 'Shipping zone not found'
      });
      return;
    }
    
    const updatedZone = await shippingRepo.updateShippingZone(id, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedZone,
      message: 'Shipping zone updated successfully'
    });
  } catch (error) {
    console.error('Error updating shipping zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shipping zone'
    });
  }
};

export const deleteShippingZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingZone = await shippingRepo.findShippingZoneById(id);
    if (!existingZone) {
      res.status(404).json({
        success: false,
        message: 'Shipping zone not found'
      });
      return;
    }
    
    const deleted = await shippingRepo.deleteShippingZone(id);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Shipping zone deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete shipping zone'
      });
    }
  } catch (error) {
    console.error('Error deleting shipping zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shipping zone'
    });
  }
};

// =============================================================================
// Shipping Methods
// =============================================================================

export const getShippingMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, offset } = req.query;
    const result = await shippingRepo.findAllShippingMethods({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    res.status(200).json({
      success: true,
      data: result.methods,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping methods'
    });
  }
};

export const getActiveShippingMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const methods = await shippingRepo.findActiveShippingMethods();
    res.status(200).json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Error fetching active shipping methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active shipping methods'
    });
  }
};

export const getShippingMethodById = async (req: Request, res: Response): Promise<void> => {
  try {
    const method = await shippingRepo.findShippingMethodById(req.params.id);
    
    if (!method) {
      res.status(404).json({
        success: false,
        message: 'Shipping method not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: method
    });
  } catch (error) {
    console.error('Error fetching shipping method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping method'
    });
  }
};

export const getShippingMethodsByCarrier = async (req: Request, res: Response): Promise<void> => {
  try {
    const methods = await shippingRepo.findShippingMethodsByCarrier(req.params.carrierId);
    res.status(200).json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Error fetching shipping methods by carrier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping methods'
    });
  }
};

export const createShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, distributionShippingCarrierId, estimatedDeliveryDays, isActive } = req.body;
    
    if (!name || !code) {
      res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
      return;
    }
    
    const method = await shippingRepo.createShippingMethod({
      name,
      code,
      distributionShippingCarrierId: distributionShippingCarrierId || null,
      estimatedDeliveryDays: estimatedDeliveryDays || null,
      isActive: isActive !== false,
      ...req.body
    });
    
    res.status(201).json({
      success: true,
      data: method,
      message: 'Shipping method created successfully'
    });
  } catch (error) {
    console.error('Error creating shipping method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shipping method'
    });
  }
};

export const updateShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingMethod = await shippingRepo.findShippingMethodById(id);
    if (!existingMethod) {
      res.status(404).json({
        success: false,
        message: 'Shipping method not found'
      });
      return;
    }
    
    const updatedMethod = await shippingRepo.updateShippingMethod(id, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedMethod,
      message: 'Shipping method updated successfully'
    });
  } catch (error) {
    console.error('Error updating shipping method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shipping method'
    });
  }
};

export const deleteShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingMethod = await shippingRepo.findShippingMethodById(id);
    if (!existingMethod) {
      res.status(404).json({
        success: false,
        message: 'Shipping method not found'
      });
      return;
    }
    
    const deleted = await shippingRepo.deleteShippingMethod(id);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Shipping method deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete shipping method'
      });
    }
  } catch (error) {
    console.error('Error deleting shipping method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shipping method'
    });
  }
};

// =============================================================================
// Shipping Carriers
// =============================================================================

export const getShippingCarriers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, offset } = req.query;
    const result = await shippingRepo.findAllShippingCarriers({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    res.status(200).json({
      success: true,
      data: result.carriers,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching shipping carriers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping carriers'
    });
  }
};

export const getActiveShippingCarriers = async (req: Request, res: Response): Promise<void> => {
  try {
    const carriers = await shippingRepo.findActiveShippingCarriers();
    res.status(200).json({
      success: true,
      data: carriers
    });
  } catch (error) {
    console.error('Error fetching active shipping carriers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active shipping carriers'
    });
  }
};

export const getShippingCarrierById = async (req: Request, res: Response): Promise<void> => {
  try {
    const carrier = await shippingRepo.findShippingCarrierById(req.params.id);
    
    if (!carrier) {
      res.status(404).json({
        success: false,
        message: 'Shipping carrier not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: carrier
    });
  } catch (error) {
    console.error('Error fetching shipping carrier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping carrier'
    });
  }
};

export const getShippingCarrierByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const carrier = await shippingRepo.findShippingCarrierByCode(req.params.code);
    
    if (!carrier) {
      res.status(404).json({
        success: false,
        message: 'Shipping carrier not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: carrier
    });
  } catch (error) {
    console.error('Error fetching shipping carrier by code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping carrier'
    });
  }
};

export const createShippingCarrier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) {
      res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
      return;
    }
    
    // Check if code already exists
    const existing = await shippingRepo.findShippingCarrierByCode(code);
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A shipping carrier with this code already exists'
      });
      return;
    }
    
    const carrier = await shippingRepo.createShippingCarrier(req.body);
    
    res.status(201).json({
      success: true,
      data: carrier,
      message: 'Shipping carrier created successfully'
    });
  } catch (error) {
    console.error('Error creating shipping carrier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shipping carrier'
    });
  }
};

export const updateShippingCarrier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingCarrier = await shippingRepo.findShippingCarrierById(id);
    if (!existingCarrier) {
      res.status(404).json({
        success: false,
        message: 'Shipping carrier not found'
      });
      return;
    }
    
    // Check if updating to an existing code
    if (req.body.code && req.body.code !== existingCarrier.code) {
      const codeExists = await shippingRepo.findShippingCarrierByCode(req.body.code);
      if (codeExists) {
        res.status(409).json({
          success: false,
          message: 'A shipping carrier with this code already exists'
        });
        return;
      }
    }
    
    const updatedCarrier = await shippingRepo.updateShippingCarrier(id, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedCarrier,
      message: 'Shipping carrier updated successfully'
    });
  } catch (error) {
    console.error('Error updating shipping carrier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shipping carrier'
    });
  }
};

export const deleteShippingCarrier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingCarrier = await shippingRepo.findShippingCarrierById(id);
    if (!existingCarrier) {
      res.status(404).json({
        success: false,
        message: 'Shipping carrier not found'
      });
      return;
    }
    
    const deleted = await shippingRepo.deleteShippingCarrier(id);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Shipping carrier deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete shipping carrier'
      });
    }
  } catch (error) {
    console.error('Error deleting shipping carrier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shipping carrier'
    });
  }
};

// =============================================================================
// Shipping Rates
// =============================================================================

export const getShippingRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, offset } = req.query;
    const result = await shippingRepo.findAllShippingRates({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    res.status(200).json({
      success: true,
      data: result.rates,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping rates'
    });
  }
};

export const getShippingRateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const rate = await shippingRepo.findShippingRateById(req.params.id);
    
    if (!rate) {
      res.status(404).json({
        success: false,
        message: 'Shipping rate not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: rate
    });
  } catch (error) {
    console.error('Error fetching shipping rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping rate'
    });
  }
};

export const getShippingRatesByZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const rates = await shippingRepo.findShippingRatesByZone(req.params.zoneId);
    res.status(200).json({
      success: true,
      data: rates
    });
  } catch (error) {
    console.error('Error fetching shipping rates by zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping rates'
    });
  }
};

export const getShippingRatesByMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const rates = await shippingRepo.findShippingRatesByMethod(req.params.methodId);
    res.status(200).json({
      success: true,
      data: rates
    });
  } catch (error) {
    console.error('Error fetching shipping rates by method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping rates'
    });
  }
};

export const createShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { distributionShippingZoneId, distributionShippingMethodId, baseRate } = req.body;
    
    if (!distributionShippingZoneId || !distributionShippingMethodId) {
      res.status(400).json({
        success: false,
        message: 'Zone ID and method ID are required'
      });
      return;
    }
    
    // Validate zone exists
    const zone = await shippingRepo.findShippingZoneById(distributionShippingZoneId);
    if (!zone) {
      res.status(400).json({
        success: false,
        message: 'Shipping zone not found'
      });
      return;
    }
    
    // Validate method exists
    const method = await shippingRepo.findShippingMethodById(distributionShippingMethodId);
    if (!method) {
      res.status(400).json({
        success: false,
        message: 'Shipping method not found'
      });
      return;
    }
    
    const rate = await shippingRepo.createShippingRate({
      ...req.body,
      baseRate: baseRate || '0'
    });
    
    res.status(201).json({
      success: true,
      data: rate,
      message: 'Shipping rate created successfully'
    });
  } catch (error) {
    console.error('Error creating shipping rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shipping rate'
    });
  }
};

export const updateShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingRate = await shippingRepo.findShippingRateById(id);
    if (!existingRate) {
      res.status(404).json({
        success: false,
        message: 'Shipping rate not found'
      });
      return;
    }
    
    const updatedRate = await shippingRepo.updateShippingRate(id, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedRate,
      message: 'Shipping rate updated successfully'
    });
  } catch (error) {
    console.error('Error updating shipping rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shipping rate'
    });
  }
};

export const deleteShippingRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingRate = await shippingRepo.findShippingRateById(id);
    if (!existingRate) {
      res.status(404).json({
        success: false,
        message: 'Shipping rate not found'
      });
      return;
    }
    
    const deleted = await shippingRepo.deleteShippingRate(id);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Shipping rate deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete shipping rate'
      });
    }
  } catch (error) {
    console.error('Error deleting shipping rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shipping rate'
    });
  }
};

// =============================================================================
// Shipping Rate Calculation (Use Cases)
// =============================================================================

/**
 * Calculate shipping rate for a specific method and destination
 */
export const calculateRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      destinationCountry,
      destinationState,
      destinationPostalCode,
      shippingMethodId,
      orderValue,
      orderWeight,
      weightUnit,
      currency,
      itemCount,
      orderId
    } = req.body;

    if (!destinationCountry || !shippingMethodId) {
      res.status(400).json({
        success: false,
        message: 'Destination country and shipping method ID are required'
      });
      return;
    }

    const result = await calculateShippingRate.execute({
      destinationCountry,
      destinationState,
      destinationPostalCode,
      shippingMethodId,
      orderValue: orderValue || 0,
      orderWeight: orderWeight || 0,
      weightUnit,
      currency,
      itemCount,
      orderId
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        baseRate: result.rate!.baseRate.amount,
        perItemRate: result.rate!.perItemRate.amount,
        totalRate: result.rate!.totalRate.amount,
        currency: result.rate!.totalRate.currency,
        formatted: result.rate!.totalRate.format(),
        isFreeShipping: result.rate!.isFreeShipping,
        zone: {
          id: result.rate!.zoneId,
          name: result.rate!.zoneName
        },
        method: {
          id: result.rate!.methodId,
          name: result.rate!.methodName
        }
      }
    });
  } catch (error) {
    console.error('Error calculating shipping rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate shipping rate'
    });
  }
};

/**
 * Get all available shipping methods for a destination with calculated rates
 */
export const getAvailableMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      destinationCountry,
      destinationState,
      destinationPostalCode,
      orderValue,
      orderWeight,
      weightUnit,
      currency,
      itemCount
    } = req.query;

    if (!destinationCountry) {
      res.status(400).json({
        success: false,
        message: 'Destination country is required'
      });
      return;
    }

    const result = await getAvailableShippingMethods.execute({
      destinationCountry: destinationCountry as string,
      destinationState: destinationState as string | undefined,
      destinationPostalCode: destinationPostalCode as string | undefined,
      orderValue: orderValue ? parseFloat(orderValue as string) : 0,
      orderWeight: orderWeight ? parseFloat(orderWeight as string) : undefined,
      weightUnit: weightUnit as 'kg' | 'g' | 'lb' | 'oz' | undefined,
      currency: currency as string | undefined,
      itemCount: itemCount ? parseInt(itemCount as string) : undefined
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        methods: result.methods,
        defaultMethodId: result.defaultMethodId
      }
    });
  } catch (error) {
    console.error('Error getting available shipping methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available shipping methods'
    });
  }
};
