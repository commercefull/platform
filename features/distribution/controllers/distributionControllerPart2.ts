import { Request, Response } from 'express';
import { DistributionRepo } from '../repos/distributionRepo';

export class DistributionControllerPart2 {
  private distributionRepo: DistributionRepo;

  constructor() {
    this.distributionRepo = new DistributionRepo();
  }

  // Shipping Method Controllers
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
      
      // Check if method is being used in any rules or fulfillments
      // This would require additional methods
      
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

  // Fulfillment Partner Controllers
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
      
      // Check if partner is being used in any rules
      // This would require additional methods
      
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
}
