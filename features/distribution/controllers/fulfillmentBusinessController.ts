import { Request, Response } from 'express';
import { DistributionRepo } from '../repos/distributionRepo';

// Create a single instance of the repo to be used by all functions
const distributionRepo = new DistributionRepo();

// Shipping Method Controllers
export const getShippingMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      const methods = await distributionRepo.findAllShippingMethods();
      res.status(200).json({
        success: true,
        data: methods
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
      const methods = await distributionRepo.findActiveShippingMethods();
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
      const method = await distributionRepo.findShippingMethodById(req.params.id);
      
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
      const methods = await distributionRepo.findShippingMethodsByCarrier(req.params.carrier);
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
      const { name, code, carrier, estimatedDeliveryDays, isActive, basePrice } = req.body;
      
      // Validate required fields
      if (!name || !code || !carrier) {
        res.status(400).json({
          success: false,
          message: 'Name, code, and carrier are required'
        });
        return;
      }
      
      const method = await distributionRepo.createShippingMethod({
        name,
        code,
        carrier,
        estimatedDeliveryDays: estimatedDeliveryDays || 3, // Default to 3 days
        isActive: isActive !== undefined ? isActive : true,
        basePrice: basePrice || 0
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
      
      // Check if method exists
      const existingMethod = await distributionRepo.findShippingMethodById(id);
      if (!existingMethod) {
        res.status(404).json({
          success: false,
          message: 'Shipping method not found'
        });
        return;
      }
      
      const updatedMethod = await distributionRepo.updateShippingMethod(id, req.body);
      
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
      
      // Check if method exists
      const existingMethod = await distributionRepo.findShippingMethodById(id);
      if (!existingMethod) {
        res.status(404).json({
          success: false,
          message: 'Shipping method not found'
        });
        return;
      }
      
      // Check if method is being used in any rules or fulfillments
      // This would require additional methods
      
      const deleted = await distributionRepo.deleteShippingMethod(id);
      
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

// Fulfillment Partner Controllers
export const getFulfillmentPartners = async (req: Request, res: Response): Promise<void> => {
    try {
      const partners = await distributionRepo.findAllFulfillmentPartners();
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
      const partners = await distributionRepo.findActiveFulfillmentPartners();
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
      const partner = await distributionRepo.findFulfillmentPartnerById(req.params.id);
      
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
      const partner = await distributionRepo.findFulfillmentPartnerByCode(req.params.code);
      
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
      const { 
        name, code, apiKey, apiEndpoint, isActive,
        contactName, contactEmail, contactPhone
      } = req.body;
      
      if (!name || !code) {
        res.status(400).json({
          success: false,
          message: 'Name and code are required'
        });
        return;
      }
      
      // Check if partner with same code exists
      const existingPartner = await distributionRepo.findFulfillmentPartnerByCode(code);
      if (existingPartner) {
        res.status(409).json({
          success: false,
          message: 'A fulfillment partner with this code already exists'
        });
        return;
      }
      
      const partner = await distributionRepo.createFulfillmentPartner({
        name,
        code,
        apiKey,
        apiEndpoint,
        isActive: isActive !== undefined ? isActive : true,
        contactName: contactName || '',
        contactEmail: contactEmail || '',
        contactPhone: contactPhone || ''
      });
      
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
      
      // Check if partner exists
      const existingPartner = await distributionRepo.findFulfillmentPartnerById(id);
      if (!existingPartner) {
        res.status(404).json({
          success: false,
          message: 'Fulfillment partner not found'
        });
        return;
      }
      
      // If code is changing, check if new code is available
      if (req.body.code && req.body.code !== existingPartner.code) {
        const partnerWithCode = await distributionRepo.findFulfillmentPartnerByCode(req.body.code);
        if (partnerWithCode) {
          res.status(409).json({
            success: false,
            message: 'A fulfillment partner with this code already exists'
          });
          return;
        }
      }
      
      const updatedPartner = await distributionRepo.updateFulfillmentPartner(id, req.body);
      
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
      
      // Check if partner exists
      const existingPartner = await distributionRepo.findFulfillmentPartnerById(id);
      if (!existingPartner) {
        res.status(404).json({
          success: false,
          message: 'Fulfillment partner not found'
        });
        return;
      }
      
      // Check if partner is being used in any rules
      // This would require additional methods
      
      const deleted = await distributionRepo.deleteFulfillmentPartner(id);
      
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

// Order Fulfillment Controllers
export const getOrderFulfillments = async (req: Request, res: Response): Promise<void> => {
    try {
      const fulfillments = await distributionRepo.findAllOrderFulfillments();
      res.status(200).json({
        success: true,
        data: fulfillments
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
      const fulfillment = await distributionRepo.findOrderFulfillmentById(req.params.id);
      
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
      const fulfillments = await distributionRepo.findOrderFulfillmentsByOrderId(req.params.orderId);
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
      const status = req.params.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
      
      // Validate status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled'
        });
        return;
      }
      
      const fulfillments = await distributionRepo.findOrderFulfillmentsByStatus(status);
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

export const getOrderFulfillmentsByDistributionCenter = async (req: Request, res: Response): Promise<void> => {
    try {
      const fulfillments = await distributionRepo.findOrderFulfillmentsByDistributionCenter(req.params.centerId);
      res.status(200).json({
        success: true,
        data: fulfillments
      });
    } catch (error) {
      console.error('Error fetching order fulfillments by distribution center:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order fulfillments'
      });
    }
};

export const createOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        orderId, distributionCenterId, ruleId, status,
        shippingMethodId, trackingNumber, trackingUrl, notes
      } = req.body;
      
      // Validate required fields
      if (!orderId || !distributionCenterId || !shippingMethodId) {
        res.status(400).json({
          success: false,
          message: 'OrderId, distributionCenterId, and shippingMethodId are required'
        });
        return;
      }
      
      // Validate status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (status && !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled'
        });
        return;
      }
      
      // Validate that referenced entities exist
      const centerExists = await distributionRepo.findDistributionCenterById(distributionCenterId);
      if (!centerExists) {
        res.status(400).json({
          success: false,
          message: 'Distribution center not found'
        });
        return;
      }
      
      const methodExists = await distributionRepo.findShippingMethodById(shippingMethodId);
      if (!methodExists) {
        res.status(400).json({
          success: false,
          message: 'Shipping method not found'
        });
        return;
      }
      
      // Rule is optional, but if provided, validate it
      if (ruleId) {
        const ruleExists = await distributionRepo.findDistributionRuleById(ruleId);
        if (!ruleExists) {
          res.status(400).json({
            success: false,
            message: 'Distribution rule not found'
          });
          return;
        }
      }
      
      // Set dates based on status
      let shippedAt = undefined;
      let deliveredAt = undefined;
      
      if (status === 'shipped') {
        shippedAt = new Date();
      } else if (status === 'delivered') {
        shippedAt = new Date();
        deliveredAt = new Date();
      }
      
      const fulfillment = await distributionRepo.createOrderFulfillment({
        orderId,
        distributionCenterId,
        ruleId: ruleId || '', // Empty string if not provided
        status: status || 'pending',
        shippingMethodId,
        trackingNumber,
        trackingUrl,
        shippedAt,
        deliveredAt,
        notes
      });
      
      res.status(201).json({
        success: true,
        data: fulfillment,
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
      
      // Check if fulfillment exists
      const existingFulfillment = await distributionRepo.findOrderFulfillmentById(id);
      if (!existingFulfillment) {
        res.status(404).json({
          success: false,
          message: 'Order fulfillment not found'
        });
        return;
      }
      
      // Validate status if it's being updated
      if (req.body.status) {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(req.body.status)) {
          res.status(400).json({
            success: false,
            message: 'Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled'
          });
          return;
        }
      }
      
      // Validate that referenced entities exist if they are being updated
      if (req.body.distributionCenterId) {
        const centerExists = await distributionRepo.findDistributionCenterById(req.body.distributionCenterId);
        if (!centerExists) {
          res.status(400).json({
            success: false,
            message: 'Distribution center not found'
          });
          return;
        }
      }
      
      if (req.body.shippingMethodId) {
        const methodExists = await distributionRepo.findShippingMethodById(req.body.shippingMethodId);
        if (!methodExists) {
          res.status(400).json({
            success: false,
            message: 'Shipping method not found'
          });
          return;
        }
      }
      
      if (req.body.ruleId) {
        const ruleExists = await distributionRepo.findDistributionRuleById(req.body.ruleId);
        if (!ruleExists) {
          res.status(400).json({
            success: false,
            message: 'Distribution rule not found'
          });
          return;
        }
      }
      
      const updatedFulfillment = await distributionRepo.updateOrderFulfillment(id, req.body);
      
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
      const { status, trackingNumber, trackingUrl } = req.body;
      
      // Check if fulfillment exists
      const existingFulfillment = await distributionRepo.findOrderFulfillmentById(id);
      if (!existingFulfillment) {
        res.status(404).json({
          success: false,
          message: 'Order fulfillment not found'
        });
        return;
      }
      
      // Validate status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled'
        });
        return;
      }
      
      const updatedFulfillment = await distributionRepo.updateOrderFulfillmentStatus(id, status, { trackingNumber, trackingUrl });
      
      res.status(200).json({
        success: true,
        data: updatedFulfillment,
        message: `Order fulfillment status updated to ${status} successfully`
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
      
      // Check if fulfillment exists
      const existingFulfillment = await distributionRepo.findOrderFulfillmentById(id);
      if (!existingFulfillment) {
        res.status(404).json({
          success: false,
          message: 'Order fulfillment not found'
        });
        return;
      }
      
      // Only allow deletion of pending fulfillments
      if (existingFulfillment.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'Only pending fulfillments can be deleted'
        });
        return;
      }
      
      const deleted = await distributionRepo.deleteOrderFulfillment(id);
      
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
