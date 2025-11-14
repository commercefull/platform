import { Request, Response } from 'express';
import { DistributionRepo } from '../repos/distributionRepo';

// Create a single instance of the repo to be used by all functions
const distributionRepo = new DistributionRepo();
export const getDistributionCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const centers = await distributionRepo.findAllDistributionCenters();
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

export const getActiveDistributionCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const centers = await distributionRepo.findActiveDistributionCenters();
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

export const getDistributionCenterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const center = await distributionRepo.findDistributionCenterById(req.params.id);

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

export const getDistributionCenterByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const center = await distributionRepo.findDistributionCenterByCode(req.params.code);

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

export const createDistributionCenter = async (req: Request, res: Response): Promise<void> => {
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
    const existingCenter = await distributionRepo.findDistributionCenterByCode(code);
    if (existingCenter) {
      res.status(409).json({
        success: false,
        message: 'A distribution center with this code already exists'
      });
      return;
    }

    const center = await distributionRepo.createDistributionCenter({
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

export const updateDistributionCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if center exists
    const existingCenter = await distributionRepo.findDistributionCenterById(id);
    if (!existingCenter) {
      res.status(404).json({
        success: false,
        message: 'Distribution center not found'
      });
      return;
    }

    // Check if updating to an existing code
    if (req.body.code && req.body.code !== existingCenter.code) {
      const codeCheck = await distributionRepo.findDistributionCenterByCode(req.body.code);
      if (codeCheck) {
        res.status(409).json({
          success: false,
          message: 'A distribution center with this code already exists'
        });
        return;
      }
    }

    const updatedCenter = await distributionRepo.updateDistributionCenter(id, req.body);

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

export const deleteDistributionCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if center exists
    const existingCenter = await distributionRepo.findDistributionCenterById(id);
    if (!existingCenter) {
      res.status(404).json({
        success: false,
        message: 'Distribution center not found'
      });
      return;
    }

    const deleted = await distributionRepo.deleteDistributionCenter(id);

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

// Distribution Rule Controllers
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

export const getDistributionRulesByCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    // Use the correct method name as per the repository implementation
    const rules = await distributionRepo.findDistributionRulesByZone(req.params.centerId);
    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching distribution rules by center:', error);
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

    // Check if rule is being used in any order fulfillments
    // This would require additional methods

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

