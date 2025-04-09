import { Request, Response } from 'express';
import { DistributionRepo } from '../repos/distributionRepo';

export class DistributionController {
  private distributionRepo: DistributionRepo;

  constructor() {
    this.distributionRepo = new DistributionRepo();
  }

  // ---------- Distribution Center Methods ----------

  getDistributionCenters = async (req: Request, res: Response): Promise<void> => {
    try {
      const centers = await this.distributionRepo.findAllDistributionCenters();
      res.status(200).json({
        success: true,
        data: centers
      });
    } catch (error) {
      console.error('Error fetching distribution centers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distribution centers'
      });
    }
  };

  getActiveDistributionCenters = async (req: Request, res: Response): Promise<void> => {
    try {
      const centers = await this.distributionRepo.findActiveDistributionCenters();
      res.status(200).json({
        success: true,
        data: centers
      });
    } catch (error) {
      console.error('Error fetching active distribution centers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active distribution centers'
      });
    }
  };

  getDistributionCenterById = async (req: Request, res: Response): Promise<void> => {
    try {
      const center = await this.distributionRepo.findDistributionCenterById(req.params.id);
      
      if (!center) {
        res.status(404).json({
          success: false,
          message: 'Distribution center not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: center
      });
    } catch (error) {
      console.error('Error fetching distribution center:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distribution center'
      });
    }
  };

  getDistributionCenterByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const center = await this.distributionRepo.findDistributionCenterByCode(req.params.code);
      
      if (!center) {
        res.status(404).json({
          success: false,
          message: 'Distribution center not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: center
      });
    } catch (error) {
      console.error('Error fetching distribution center by code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch distribution center'
      });
    }
  };

  createDistributionCenter = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name, code, address, city, state, postalCode, country,
        contactPhone, contactEmail, isActive, capacity
      } = req.body;
      
      // Validate required fields
      if (!name || !code || !address || !city) {
        res.status(400).json({
          success: false,
          message: 'Name, code, address, and city are required'
        });
        return;
      }
      
      // Check if center with same code exists
      const existingCenter = await this.distributionRepo.findDistributionCenterByCode(code);
      if (existingCenter) {
        res.status(409).json({
          success: false,
          message: 'A distribution center with this code already exists'
        });
        return;
      }
      
      const center = await this.distributionRepo.createDistributionCenter({
        name,
        code,
        address,
        city,
        state,
        postalCode,
        country,
        contactPhone,
        contactEmail,
        isActive: isActive !== undefined ? isActive : true,
        capacity: capacity || 0
      });
      
      res.status(201).json({
        success: true,
        data: center,
        message: 'Distribution center created successfully'
      });
    } catch (error) {
      console.error('Error creating distribution center:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create distribution center'
      });
    }
  };

  updateDistributionCenter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if center exists
      const existingCenter = await this.distributionRepo.findDistributionCenterById(id);
      if (!existingCenter) {
        res.status(404).json({
          success: false,
          message: 'Distribution center not found'
        });
        return;
      }
      
      // Check if updating to an existing code
      if (req.body.code && req.body.code !== existingCenter.code) {
        const codeExists = await this.distributionRepo.findDistributionCenterByCode(req.body.code);
        if (codeExists) {
          res.status(409).json({
            success: false,
            message: 'A distribution center with this code already exists'
          });
          return;
        }
      }
      
      const updatedCenter = await this.distributionRepo.updateDistributionCenter(id, req.body);
      
      res.status(200).json({
        success: true,
        data: updatedCenter,
        message: 'Distribution center updated successfully'
      });
    } catch (error) {
      console.error('Error updating distribution center:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update distribution center'
      });
    }
  };

  deleteDistributionCenter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if center exists
      const existingCenter = await this.distributionRepo.findDistributionCenterById(id);
      if (!existingCenter) {
        res.status(404).json({
          success: false,
          message: 'Distribution center not found'
        });
        return;
      }
      
      const deleted = await this.distributionRepo.deleteDistributionCenter(id);
      
      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Distribution center deleted successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to delete distribution center'
        });
      }
    } catch (error) {
      console.error('Error deleting distribution center:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete distribution center'
      });
    }
  };

  // ---------- Shipping Zone Methods ----------

  getShippingZones = async (req: Request, res: Response): Promise<void> => {
    try {
      const zones = await this.distributionRepo.findAllShippingZones();
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

  getActiveShippingZones = async (req: Request, res: Response): Promise<void> => {
    try {
      const zones = await this.distributionRepo.findActiveShippingZones();
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

  getShippingZoneById = async (req: Request, res: Response): Promise<void> => {
    try {
      const zone = await this.distributionRepo.findShippingZoneById(req.params.id);
      
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

  createShippingZone = async (req: Request, res: Response): Promise<void> => {
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
      
      const zone = await this.distributionRepo.createShippingZone(formattedZone);
      
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

  updateShippingZone = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if zone exists
      const existingZone = await this.distributionRepo.findShippingZoneById(id);
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
      
      const updatedZone = await this.distributionRepo.updateShippingZone(id, updates);
      
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

  deleteShippingZone = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if zone exists
      const existingZone = await this.distributionRepo.findShippingZoneById(id);
      if (!existingZone) {
        res.status(404).json({
          success: false,
          message: 'Shipping zone not found'
        });
        return;
      }
      
      const deleted = await this.distributionRepo.deleteShippingZone(id);
      
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

  getShippingMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      const methods = await this.distributionRepo.findAllShippingMethods();
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

  getActiveShippingMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      const methods = await this.distributionRepo.findActiveShippingMethods();
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

  getShippingMethodById = async (req: Request, res: Response): Promise<void> => {
    try {
      const method = await this.distributionRepo.findShippingMethodById(req.params.id);
      
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

  getShippingMethodsByCarrier = async (req: Request, res: Response): Promise<void> => {
    try {
      const methods = await this.distributionRepo.findShippingMethodsByCarrier(req.params.carrier);
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

  createShippingMethod = async (req: Request, res: Response): Promise<void> => {
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
      
      const method = await this.distributionRepo.createShippingMethod({
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

  updateShippingMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if method exists
      const existingMethod = await this.distributionRepo.findShippingMethodById(id);
      if (!existingMethod) {
        res.status(404).json({
          success: false,
          message: 'Shipping method not found'
        });
        return;
      }
      
      const updatedMethod = await this.distributionRepo.updateShippingMethod(id, req.body);
      
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

  deleteShippingMethod = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if method exists
      const existingMethod = await this.distributionRepo.findShippingMethodById(id);
      if (!existingMethod) {
        res.status(404).json({
          success: false,
          message: 'Shipping method not found'
        });
        return;
      }
      
      const deleted = await this.distributionRepo.deleteShippingMethod(id);
      
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

  getFulfillmentPartners = async (req: Request, res: Response): Promise<void> => {
    try {
      const partners = await this.distributionRepo.findAllFulfillmentPartners();
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

  getActiveFulfillmentPartners = async (req: Request, res: Response): Promise<void> => {
    try {
      const partners = await this.distributionRepo.findActiveFulfillmentPartners();
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

  getFulfillmentPartnerById = async (req: Request, res: Response): Promise<void> => {
    try {
      const partner = await this.distributionRepo.findFulfillmentPartnerById(req.params.id);
      
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

  getFulfillmentPartnerByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const partner = await this.distributionRepo.findFulfillmentPartnerByCode(req.params.code);
      
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

  createFulfillmentPartner = async (req: Request, res: Response): Promise<void> => {
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
      const existingPartner = await this.distributionRepo.findFulfillmentPartnerByCode(code);
      if (existingPartner) {
        res.status(409).json({
          success: false,
          message: 'A fulfillment partner with this code already exists'
        });
        return;
      }
      
      const partner = await this.distributionRepo.createFulfillmentPartner({
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

  updateFulfillmentPartner = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if partner exists
      const existingPartner = await this.distributionRepo.findFulfillmentPartnerById(id);
      if (!existingPartner) {
        res.status(404).json({
          success: false,
          message: 'Fulfillment partner not found'
        });
        return;
      }
      
      // Check if updating to an existing code
      if (req.body.code && req.body.code !== existingPartner.code) {
        const codeExists = await this.distributionRepo.findFulfillmentPartnerByCode(req.body.code);
        if (codeExists) {
          res.status(409).json({
            success: false,
            message: 'A fulfillment partner with this code already exists'
          });
          return;
        }
      }
      
      const updatedPartner = await this.distributionRepo.updateFulfillmentPartner(id, req.body);
      
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

  deleteFulfillmentPartner = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if partner exists
      const existingPartner = await this.distributionRepo.findFulfillmentPartnerById(id);
      if (!existingPartner) {
        res.status(404).json({
          success: false,
          message: 'Fulfillment partner not found'
        });
        return;
      }
      
      const deleted = await this.distributionRepo.deleteFulfillmentPartner(id);
      
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

  // ---------- Order Fulfillment Methods ----------

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
