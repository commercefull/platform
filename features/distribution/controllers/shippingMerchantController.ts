import { Request, Response } from 'express';
import { DistributionRepo } from '../repos/distributionRepo';

// Create a single instance of the repo to be used by all functions
const distributionRepo = new DistributionRepo();
// ---------- Shipping Zone Methods ----------

export const getShippingZones = async (req: Request, res: Response): Promise<void> => {
    try {
      const zones = await distributionRepo.findAllShippingZones();
      res.status(200).json({
        success: true,
        data: zones
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
      const zones = await distributionRepo.findActiveShippingZones();
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
      const zone = await distributionRepo.findShippingZoneById(req.params.id);
      
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
      const { name, countries, regions, postalCodes, isActive } = req.body;
      
      // Validate required fields
      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Name is required'
        });
        return;
      }
      
      // Ensure arrays are proper format
      const formattedZone = {
        name,
        countries: Array.isArray(countries) ? countries : [],
        regions: Array.isArray(regions) ? regions : [],
        postalCodes: Array.isArray(postalCodes) ? postalCodes : [],
        isActive: isActive !== undefined ? isActive : true
      };
      
      const zone = await distributionRepo.createShippingZone(formattedZone);
      
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
      
      // Check if zone exists
      const existingZone = await distributionRepo.findShippingZoneById(id);
      if (!existingZone) {
        res.status(404).json({
          success: false,
          message: 'Shipping zone not found'
        });
        return;
      }
      
      // Format arrays if provided
      const updates: any = { ...req.body };
      if (updates.countries !== undefined && !Array.isArray(updates.countries)) {
        updates.countries = [];
      }
      
      if (updates.regions !== undefined && !Array.isArray(updates.regions)) {
        updates.regions = [];
      }
      
      if (updates.postalCodes !== undefined && !Array.isArray(updates.postalCodes)) {
        updates.postalCodes = [];
      }
      
      const updatedZone = await distributionRepo.updateShippingZone(id, updates);
      
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
      
      // Check if zone exists
      const existingZone = await distributionRepo.findShippingZoneById(id);
      if (!existingZone) {
        res.status(404).json({
          success: false,
          message: 'Shipping zone not found'
        });
        return;
      }
      
      const deleted = await distributionRepo.deleteShippingZone(id);
      
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

// ---------- Shipping Method Methods ----------

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

  // ---------- Fulfillment Partner Methods ----------

// ---------- Fulfillment Partner Methods ----------

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
      
      // Validate required fields
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
      
      // Check if updating to an existing code
      if (req.body.code && req.body.code !== existingPartner.code) {
        const codeExists = await distributionRepo.findFulfillmentPartnerByCode(req.body.code);
        if (codeExists) {
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

// ---------- Distribution Rule Methods ----------

export const getDistributionRules = async (req: Request, res: Response): Promise<void> => {
    try {
      const rules = await distributionRepo.findAllDistributionRules();
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
      const rules = await distributionRepo.findActiveDistributionRules();
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
      const rule = await distributionRepo.findDistributionRuleById(req.params.id);
      
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
      const rules = await distributionRepo.findDistributionRulesByZone(req.params.zoneId);
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
      const rule = await distributionRepo.findDefaultDistributionRule();
      
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
      const centerExists = await distributionRepo.findDistributionCenterById(distributionCenterId);
      if (!centerExists) {
        res.status(400).json({
          success: false,
          message: 'Distribution center not found'
        });
        return;
      }
      
      const zoneExists = await distributionRepo.findShippingZoneById(shippingZoneId);
      if (!zoneExists) {
        res.status(400).json({
          success: false,
          message: 'Shipping zone not found'
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
      
      const partnerExists = await distributionRepo.findFulfillmentPartnerById(fulfillmentPartnerId);
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
        const rules = await distributionRepo.findAllDistributionRules();
        rulePriority = rules.length > 0 ? Math.max(...rules.map(r => r.priority)) + 1 : 1;
      }
      
      const rule = await distributionRepo.createDistributionRule({
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

export const updateDistributionRule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if rule exists
      const existingRule = await distributionRepo.findDistributionRuleById(id);
      if (!existingRule) {
        res.status(404).json({
          success: false,
          message: 'Distribution rule not found'
        });
        return;
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
      
      if (req.body.shippingZoneId) {
        const zoneExists = await distributionRepo.findShippingZoneById(req.body.shippingZoneId);
        if (!zoneExists) {
          res.status(400).json({
            success: false,
            message: 'Shipping zone not found'
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
      
      if (req.body.fulfillmentPartnerId) {
        const partnerExists = await distributionRepo.findFulfillmentPartnerById(req.body.fulfillmentPartnerId);
        if (!partnerExists) {
          res.status(400).json({
            success: false,
            message: 'Fulfillment partner not found'
          });
          return;
        }
      }
      
      const updatedRule = await distributionRepo.updateDistributionRule(id, req.body);
      
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
      
      // Check if rule exists
      const existingRule = await distributionRepo.findDistributionRuleById(id);
      if (!existingRule) {
        res.status(404).json({
          success: false,
          message: 'Distribution rule not found'
        });
        return;
      }
      
      const deleted = await distributionRepo.deleteDistributionRule(id);
      
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

// ---------- Order Fulfillment Methods ----------

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
