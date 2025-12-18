/**
 * Fulfillment Business Controller
 * Handles admin/merchant operations for fulfillment partners, distribution rules, and order fulfillments
 */
import { Request, Response } from 'express';
import * as fulfillmentRepo from '../repos/fulfillmentRepo';
import * as warehouseRepo from '../repos/warehouseRepo';
import * as shippingRepo from '../repos/shippingRepo';
import { createOrderFulfillment as createOrderFulfillmentUseCase } from '../useCases/fulfillment/CreateOrderFulfillment';
import { updateFulfillmentStatus as updateFulfillmentStatusUseCase, FulfillmentStatusAction } from '../useCases/fulfillment/UpdateFulfillmentStatus';
import { findBestWarehouse as findBestWarehouseUseCase } from '../useCases/warehouse/FindBestWarehouse';

// =============================================================================
// Fulfillment Partners
// =============================================================================

export const getFulfillmentPartners = async (req: Request, res: Response): Promise<void> => {
  try {
    const partners = await fulfillmentRepo.findAllFulfillmentPartners();
    res.status(200).json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('Error fetching fulfillment partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fulfillment partners'
    });
  }
};

export const getActiveFulfillmentPartners = async (req: Request, res: Response): Promise<void> => {
  try {
    const partners = await fulfillmentRepo.findActiveFulfillmentPartners();
    res.status(200).json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('Error fetching active fulfillment partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active fulfillment partners'
    });
  }
};

export const getFulfillmentPartnerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const partner = await fulfillmentRepo.findFulfillmentPartnerById(req.params.id);
    
    if (!partner) {
      res.status(404).json({
        success: false,
        message: 'Fulfillment partner not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Error fetching fulfillment partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fulfillment partner'
    });
  }
};

export const getFulfillmentPartnerByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const partner = await fulfillmentRepo.findFulfillmentPartnerByCode(req.params.code);
    
    if (!partner) {
      res.status(404).json({
        success: false,
        message: 'Fulfillment partner not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Error fetching fulfillment partner by code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fulfillment partner'
    });
  }
};

export const createFulfillmentPartner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) {
      res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
      return;
    }
    
    // Check if partner with same code exists
    const existingPartner = await fulfillmentRepo.findFulfillmentPartnerByCode(code);
    if (existingPartner) {
      res.status(409).json({
        success: false,
        message: 'A fulfillment partner with this code already exists'
      });
      return;
    }
    
    const partner = await fulfillmentRepo.createFulfillmentPartner(req.body);
    
    res.status(201).json({
      success: true,
      data: partner,
      message: 'Fulfillment partner created successfully'
    });
  } catch (error) {
    console.error('Error creating fulfillment partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fulfillment partner'
    });
  }
};

export const updateFulfillmentPartner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingPartner = await fulfillmentRepo.findFulfillmentPartnerById(id);
    if (!existingPartner) {
      res.status(404).json({
        success: false,
        message: 'Fulfillment partner not found'
      });
      return;
    }
    
    // Check if updating to an existing code
    if (req.body.code && req.body.code !== existingPartner.code) {
      const codeExists = await fulfillmentRepo.findFulfillmentPartnerByCode(req.body.code);
      if (codeExists) {
        res.status(409).json({
          success: false,
          message: 'A fulfillment partner with this code already exists'
        });
        return;
      }
    }
    
    const updatedPartner = await fulfillmentRepo.updateFulfillmentPartner(id, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedPartner,
      message: 'Fulfillment partner updated successfully'
    });
  } catch (error) {
    console.error('Error updating fulfillment partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fulfillment partner'
    });
  }
};

export const deleteFulfillmentPartner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingPartner = await fulfillmentRepo.findFulfillmentPartnerById(id);
    if (!existingPartner) {
      res.status(404).json({
        success: false,
        message: 'Fulfillment partner not found'
      });
      return;
    }
    
    const deleted = await fulfillmentRepo.deleteFulfillmentPartner(id);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Fulfillment partner deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete fulfillment partner'
      });
    }
  } catch (error) {
    console.error('Error deleting fulfillment partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fulfillment partner'
    });
  }
};

// =============================================================================
// Distribution Rules
// =============================================================================

export const getDistributionRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = await fulfillmentRepo.findAllDistributionRules();
    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching distribution rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution rules'
    });
  }
};

export const getActiveDistributionRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = await fulfillmentRepo.findActiveDistributionRules();
    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching active distribution rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active distribution rules'
    });
  }
};

export const getDistributionRuleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await fulfillmentRepo.findDistributionRuleById(req.params.id);
    
    if (!rule) {
      res.status(404).json({
        success: false,
        message: 'Distribution rule not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching distribution rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution rule'
    });
  }
};

export const getDistributionRulesByZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = await fulfillmentRepo.findDistributionRulesByZone(req.params.zoneId);
    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching distribution rules by zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch distribution rules'
    });
  }
};

export const getDefaultDistributionRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await fulfillmentRepo.findDefaultDistributionRule();
    
    if (!rule) {
      res.status(404).json({
        success: false,
        message: 'No default distribution rule found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching default distribution rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default distribution rule'
    });
  }
};

export const createDistributionRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, distributionWarehouseId, distributionShippingZoneId, distributionShippingMethodId } = req.body;
    
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Name is required'
      });
      return;
    }
    
    // Validate referenced entities if provided
    if (distributionWarehouseId) {
      const warehouse = await warehouseRepo.findWarehouseById(distributionWarehouseId);
      if (!warehouse) {
        res.status(400).json({
          success: false,
          message: 'Warehouse not found'
        });
        return;
      }
    }
    
    if (distributionShippingZoneId) {
      const zone = await shippingRepo.findShippingZoneById(distributionShippingZoneId);
      if (!zone) {
        res.status(400).json({
          success: false,
          message: 'Shipping zone not found'
        });
        return;
      }
    }
    
    if (distributionShippingMethodId) {
      const method = await shippingRepo.findShippingMethodById(distributionShippingMethodId);
      if (!method) {
        res.status(400).json({
          success: false,
          message: 'Shipping method not found'
        });
        return;
      }
    }
    
    // Set default priority if not provided
    let priority = req.body.priority;
    if (priority === undefined) {
      const rules = await fulfillmentRepo.findAllDistributionRules();
      priority = rules.length > 0 ? Math.max(...rules.map(r => r.priority)) + 1 : 1;
    }
    
    const rule = await fulfillmentRepo.createDistributionRule({
      ...req.body,
      priority
    });
    
    res.status(201).json({
      success: true,
      data: rule,
      message: 'Distribution rule created successfully'
    });
  } catch (error) {
    console.error('Error creating distribution rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create distribution rule'
    });
  }
};

export const updateDistributionRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingRule = await fulfillmentRepo.findDistributionRuleById(id);
    if (!existingRule) {
      res.status(404).json({
        success: false,
        message: 'Distribution rule not found'
      });
      return;
    }
    
    // Validate referenced entities if being updated
    if (req.body.distributionWarehouseId) {
      const warehouse = await warehouseRepo.findWarehouseById(req.body.distributionWarehouseId);
      if (!warehouse) {
        res.status(400).json({
          success: false,
          message: 'Warehouse not found'
        });
        return;
      }
    }
    
    if (req.body.distributionShippingZoneId) {
      const zone = await shippingRepo.findShippingZoneById(req.body.distributionShippingZoneId);
      if (!zone) {
        res.status(400).json({
          success: false,
          message: 'Shipping zone not found'
        });
        return;
      }
    }
    
    if (req.body.distributionShippingMethodId) {
      const method = await shippingRepo.findShippingMethodById(req.body.distributionShippingMethodId);
      if (!method) {
        res.status(400).json({
          success: false,
          message: 'Shipping method not found'
        });
        return;
      }
    }
    
    const updatedRule = await fulfillmentRepo.updateDistributionRule(id, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedRule,
      message: 'Distribution rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating distribution rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update distribution rule'
    });
  }
};

export const deleteDistributionRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingRule = await fulfillmentRepo.findDistributionRuleById(id);
    if (!existingRule) {
      res.status(404).json({
        success: false,
        message: 'Distribution rule not found'
      });
      return;
    }
    
    const deleted = await fulfillmentRepo.deleteDistributionRule(id);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Distribution rule deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete distribution rule'
      });
    }
  } catch (error) {
    console.error('Error deleting distribution rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete distribution rule'
    });
  }
};

// =============================================================================
// Order Fulfillments
// =============================================================================

export const getOrderFulfillments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit, offset } = req.query;
    const result = await fulfillmentRepo.findAllOrderFulfillments({
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });
    res.status(200).json({
      success: true,
      data: result.data,
      total: result.total
    });
  } catch (error) {
    console.error('Error fetching order fulfillments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order fulfillments'
    });
  }
};

export const getOrderFulfillmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const fulfillment = await fulfillmentRepo.findOrderFulfillmentById(req.params.id);
    
    if (!fulfillment) {
      res.status(404).json({
        success: false,
        message: 'Order fulfillment not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: fulfillment
    });
  } catch (error) {
    console.error('Error fetching order fulfillment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order fulfillment'
    });
  }
};

export const getOrderFulfillmentsByOrderId = async (req: Request, res: Response): Promise<void> => {
  try {
    const fulfillments = await fulfillmentRepo.findOrderFulfillmentsByOrderId(req.params.orderId);
    res.status(200).json({
      success: true,
      data: fulfillments
    });
  } catch (error) {
    console.error('Error fetching order fulfillments by order ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order fulfillments'
    });
  }
};

export const getOrderFulfillmentsByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.params.status as fulfillmentRepo.FulfillmentStatus;
    
    const validStatuses: fulfillmentRepo.FulfillmentStatus[] = [
      'pending', 'processing', 'picking', 'packing', 'ready_to_ship',
      'shipped', 'in_transit', 'out_for_delivery', 'delivered',
      'failed', 'returned', 'cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }
    
    const fulfillments = await fulfillmentRepo.findOrderFulfillmentsByStatus(status);
    res.status(200).json({
      success: true,
      data: fulfillments
    });
  } catch (error) {
    console.error('Error fetching order fulfillments by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order fulfillments'
    });
  }
};

export const getOrderFulfillmentsByWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const fulfillments = await fulfillmentRepo.findOrderFulfillmentsByWarehouse(req.params.warehouseId);
    res.status(200).json({
      success: true,
      data: fulfillments
    });
  } catch (error) {
    console.error('Error fetching order fulfillments by warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order fulfillments'
    });
  }
};

export const createOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      orderId, 
      orderNumber,
      warehouseId,
      shippingMethodId,
      shipToAddress,
      estimatedDeliveryAt,
      customerNotes 
    } = req.body;
    
    if (!orderId) {
      res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
      return;
    }

    if (!shipToAddress || !shipToAddress.line1 || !shipToAddress.city || !shipToAddress.postalCode || !shipToAddress.country) {
      res.status(400).json({
        success: false,
        message: 'Ship to address with line1, city, postalCode, and country is required'
      });
      return;
    }
    
    // Use the CreateOrderFulfillment use case
    const result = await createOrderFulfillmentUseCase.execute({
      orderId,
      orderNumber,
      warehouseId,
      shippingMethodId,
      shipToAddress,
      estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt) : undefined,
      customerNotes,
      createdBy: (req as any).user?.id
    });

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error
      });
      return;
    }
    
    res.status(201).json({
      success: true,
      data: result.fulfillment,
      message: 'Order fulfillment created successfully'
    });
  } catch (error) {
    console.error('Error creating order fulfillment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order fulfillment'
    });
  }
};

export const updateOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingFulfillment = await fulfillmentRepo.findOrderFulfillmentById(id);
    if (!existingFulfillment) {
      res.status(404).json({
        success: false,
        message: 'Order fulfillment not found'
      });
      return;
    }
    
    const updatedFulfillment = await fulfillmentRepo.updateOrderFulfillment(id, req.body);
    
    res.status(200).json({
      success: true,
      data: updatedFulfillment,
      message: 'Order fulfillment updated successfully'
    });
  } catch (error) {
    console.error('Error updating order fulfillment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order fulfillment'
    });
  }
};

export const updateOrderFulfillmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, trackingNumber, trackingUrl, location, reason, packageWeight, packageCount } = req.body;
    
    if (!action) {
      res.status(400).json({
        success: false,
        message: 'Action is required (e.g., start_processing, start_picking, ship, deliver, cancel)'
      });
      return;
    }

    // Validate action is a valid FulfillmentStatusAction
    const validActions: FulfillmentStatusAction[] = [
      'start_processing', 'start_picking', 'complete_picking', 'complete_packing',
      'ship', 'in_transit', 'out_for_delivery', 'deliver', 'fail', 'return', 'cancel'
    ];

    if (!validActions.includes(action)) {
      res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(', ')}`
      });
      return;
    }
    
    // Use the UpdateFulfillmentStatus use case
    const result = await updateFulfillmentStatusUseCase.execute({
      fulfillmentId: id,
      action,
      trackingNumber,
      trackingUrl,
      location,
      reason,
      packageWeight,
      packageCount,
      performedBy: (req as any).user?.id
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
      data: result.fulfillment,
      message: 'Order fulfillment status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order fulfillment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order fulfillment status'
    });
  }
};

export const deleteOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const existingFulfillment = await fulfillmentRepo.findOrderFulfillmentById(id);
    if (!existingFulfillment) {
      res.status(404).json({
        success: false,
        message: 'Order fulfillment not found'
      });
      return;
    }
    
    const deleted = await fulfillmentRepo.deleteOrderFulfillment(id);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Order fulfillment deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete order fulfillment'
      });
    }
  } catch (error) {
    console.error('Error deleting order fulfillment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order fulfillment'
    });
  }
};

// =============================================================================
// Warehouse Selection
// =============================================================================

export const getBestWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      destinationCountry, 
      destinationState, 
      destinationPostalCode,
      destinationLatitude,
      destinationLongitude,
      shippingMethodId,
      preferredWarehouseId
    } = req.query;

    if (!destinationCountry) {
      res.status(400).json({
        success: false,
        message: 'Destination country is required'
      });
      return;
    }

    const result = await findBestWarehouseUseCase.execute({
      destinationCountry: destinationCountry as string,
      destinationState: destinationState as string | undefined,
      destinationPostalCode: destinationPostalCode as string | undefined,
      destinationLatitude: destinationLatitude ? parseFloat(destinationLatitude as string) : undefined,
      destinationLongitude: destinationLongitude ? parseFloat(destinationLongitude as string) : undefined,
      shippingMethodId: shippingMethodId as string | undefined,
      preferredWarehouseId: preferredWarehouseId as string | undefined
    });

    if (!result.success) {
      res.status(404).json({
        success: false,
        message: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        bestWarehouse: result.warehouse,
        alternatives: result.alternativeWarehouses
      }
    });
  } catch (error) {
    console.error('Error finding best warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find best warehouse'
    });
  }
};
