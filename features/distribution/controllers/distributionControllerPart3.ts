import { Request, Response } from 'express';
import { DistributionRepo } from '../repos/distributionRepo';

export class DistributionControllerPart3 {
  private distributionRepo: DistributionRepo;

  constructor() {
    this.distributionRepo = new DistributionRepo();
  }

  // Distribution Rule Controllers
  getDistributionRules = async (req: Request, res: Response): Promise<void> => {
    try {
      const rules = await this.distributionRepo.findAllDistributionRules();
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

  getActiveDistributionRules = async (req: Request, res: Response): Promise<void> => {
    try {
      const rules = await this.distributionRepo.findActiveDistributionRules();
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

  getDistributionRuleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const rule = await this.distributionRepo.findDistributionRuleById(req.params.id);
      
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

  getDistributionRulesByZone = async (req: Request, res: Response): Promise<void> => {
    try {
      const rules = await this.distributionRepo.findDistributionRulesByZone(req.params.zoneId);
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

  getDefaultDistributionRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const rule = await this.distributionRepo.findDefaultDistributionRule();
      
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

  createDistributionRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name, priority, distributionCenterId, shippingZoneId,
        shippingMethodId, fulfillmentPartnerId, isDefault, isActive
      } = req.body;
      
      // Validate required fields
      if (!name || !distributionCenterId || !shippingZoneId || !shippingMethodId || !fulfillmentPartnerId) {
        res.status(400).json({
          success: false,
          message: 'Name, distributionCenterId, shippingZoneId, shippingMethodId, and fulfillmentPartnerId are required'
        });
        return;
      }
      
      // Validate that referenced entities exist
      const centerExists = await this.distributionRepo.findDistributionCenterById(distributionCenterId);
      if (!centerExists) {
        res.status(400).json({
          success: false,
          message: 'Distribution center not found'
        });
        return;
      }
      
      const zoneExists = await this.distributionRepo.findShippingZoneById(shippingZoneId);
      if (!zoneExists) {
        res.status(400).json({
          success: false,
          message: 'Shipping zone not found'
        });
        return;
      }
      
      const methodExists = await this.distributionRepo.findShippingMethodById(shippingMethodId);
      if (!methodExists) {
        res.status(400).json({
          success: false,
          message: 'Shipping method not found'
        });
        return;
      }
      
      const partnerExists = await this.distributionRepo.findFulfillmentPartnerById(fulfillmentPartnerId);
      if (!partnerExists) {
        res.status(400).json({
          success: false,
          message: 'Fulfillment partner not found'
        });
        return;
      }
      
      // Set a default priority if not provided (add to the end)
      let rulePriority = priority;
      if (rulePriority === undefined) {
        const rules = await this.distributionRepo.findAllDistributionRules();
        rulePriority = rules.length > 0 ? Math.max(...rules.map(r => r.priority)) + 1 : 1;
      }
      
      const rule = await this.distributionRepo.createDistributionRule({
        name,
        priority: rulePriority,
        distributionCenterId,
        shippingZoneId,
        shippingMethodId,
        fulfillmentPartnerId,
        isDefault: isDefault !== undefined ? isDefault : false,
        isActive: isActive !== undefined ? isActive : true
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

  updateDistributionRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if rule exists
      const existingRule = await this.distributionRepo.findDistributionRuleById(id);
      if (!existingRule) {
        res.status(404).json({
          success: false,
          message: 'Distribution rule not found'
        });
        return;
      }
      
      // Validate that referenced entities exist if they are being updated
      if (req.body.distributionCenterId) {
        const centerExists = await this.distributionRepo.findDistributionCenterById(req.body.distributionCenterId);
        if (!centerExists) {
          res.status(400).json({
            success: false,
            message: 'Distribution center not found'
          });
          return;
        }
      }
      
      if (req.body.shippingZoneId) {
        const zoneExists = await this.distributionRepo.findShippingZoneById(req.body.shippingZoneId);
        if (!zoneExists) {
          res.status(400).json({
            success: false,
            message: 'Shipping zone not found'
          });
          return;
        }
      }
      
      if (req.body.shippingMethodId) {
        const methodExists = await this.distributionRepo.findShippingMethodById(req.body.shippingMethodId);
        if (!methodExists) {
          res.status(400).json({
            success: false,
            message: 'Shipping method not found'
          });
          return;
        }
      }
      
      if (req.body.fulfillmentPartnerId) {
        const partnerExists = await this.distributionRepo.findFulfillmentPartnerById(req.body.fulfillmentPartnerId);
        if (!partnerExists) {
          res.status(400).json({
            success: false,
            message: 'Fulfillment partner not found'
          });
          return;
        }
      }
      
      const updatedRule = await this.distributionRepo.updateDistributionRule(id, req.body);
      
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

  deleteDistributionRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if rule exists
      const existingRule = await this.distributionRepo.findDistributionRuleById(id);
      if (!existingRule) {
        res.status(404).json({
          success: false,
          message: 'Distribution rule not found'
        });
        return;
      }
      
      // Check if rule is being used in any order fulfillments
      // This would require additional methods
      
      const deleted = await this.distributionRepo.deleteDistributionRule(id);
      
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

  // Order Fulfillment Controllers
  getOrderFulfillments = async (req: Request, res: Response): Promise<void> => {
    try {
      const fulfillments = await this.distributionRepo.findAllOrderFulfillments();
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

  getOrderFulfillmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const fulfillment = await this.distributionRepo.findOrderFulfillmentById(req.params.id);
      
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

  getOrderFulfillmentsByOrderId = async (req: Request, res: Response): Promise<void> => {
    try {
      const fulfillments = await this.distributionRepo.findOrderFulfillmentsByOrderId(req.params.orderId);
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

  getOrderFulfillmentsByStatus = async (req: Request, res: Response): Promise<void> => {
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
      
      const fulfillments = await this.distributionRepo.findOrderFulfillmentsByStatus(status);
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

  getOrderFulfillmentsByDistributionCenter = async (req: Request, res: Response): Promise<void> => {
    try {
      const fulfillments = await this.distributionRepo.findOrderFulfillmentsByDistributionCenter(req.params.centerId);
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

  createOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
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
      const centerExists = await this.distributionRepo.findDistributionCenterById(distributionCenterId);
      if (!centerExists) {
        res.status(400).json({
          success: false,
          message: 'Distribution center not found'
        });
        return;
      }
      
      const methodExists = await this.distributionRepo.findShippingMethodById(shippingMethodId);
      if (!methodExists) {
        res.status(400).json({
          success: false,
          message: 'Shipping method not found'
        });
        return;
      }
      
      // Rule is optional, but if provided, validate it
      if (ruleId) {
        const ruleExists = await this.distributionRepo.findDistributionRuleById(ruleId);
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
      
      const fulfillment = await this.distributionRepo.createOrderFulfillment({
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

  updateOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if fulfillment exists
      const existingFulfillment = await this.distributionRepo.findOrderFulfillmentById(id);
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
        const centerExists = await this.distributionRepo.findDistributionCenterById(req.body.distributionCenterId);
        if (!centerExists) {
          res.status(400).json({
            success: false,
            message: 'Distribution center not found'
          });
          return;
        }
      }
      
      if (req.body.shippingMethodId) {
        const methodExists = await this.distributionRepo.findShippingMethodById(req.body.shippingMethodId);
        if (!methodExists) {
          res.status(400).json({
            success: false,
            message: 'Shipping method not found'
          });
          return;
        }
      }
      
      if (req.body.ruleId) {
        const ruleExists = await this.distributionRepo.findDistributionRuleById(req.body.ruleId);
        if (!ruleExists) {
          res.status(400).json({
            success: false,
            message: 'Distribution rule not found'
          });
          return;
        }
      }
      
      const updatedFulfillment = await this.distributionRepo.updateOrderFulfillment(id, req.body);
      
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

  updateOrderFulfillmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, trackingNumber, trackingUrl } = req.body;
      
      // Check if fulfillment exists
      const existingFulfillment = await this.distributionRepo.findOrderFulfillmentById(id);
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
      
      const updatedFulfillment = await this.distributionRepo.updateOrderFulfillmentStatus(id, status, { trackingNumber, trackingUrl });
      
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

  deleteOrderFulfillment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if fulfillment exists
      const existingFulfillment = await this.distributionRepo.findOrderFulfillmentById(id);
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
      
      const deleted = await this.distributionRepo.deleteOrderFulfillment(id);
      
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
}
