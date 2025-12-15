/**
 * Shipping Controller
 * Handles shipping-related HTTP requests
 */

import { Request, Response } from 'express';
import shippingCarrierRepo from '../repos/shippingCarrierRepo';
import shippingMethodRepo from '../repos/shippingMethodRepo';
import shippingZoneRepo from '../repos/shippingZoneRepo';
import shippingRateRepo from '../repos/shippingRateRepo';
import packagingTypeRepo from '../repos/packagingTypeRepo';
import { 
  CalculateShippingRatesCommand, 
  calculateShippingRatesUseCase 
} from '../application/useCases/CalculateShippingRates';
import { 
  GetShippingMethodsQuery, 
  getShippingMethodsUseCase 
} from '../application/useCases/GetShippingMethods';

// ============================================================================
// Carriers
// ============================================================================

export const getCarriers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activeOnly } = req.query;
    const carriers = await shippingCarrierRepo.findAll(activeOnly === 'true');
    res.status(200).json({ success: true, data: carriers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCarrierById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const carrier = await shippingCarrierRepo.findById(id);
    
    if (!carrier) {
      res.status(404).json({ success: false, message: 'Carrier not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: carrier });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCarrier = async (req: Request, res: Response): Promise<void> => {
  try {
    const carrier = await shippingCarrierRepo.create(req.body);
    res.status(201).json({ success: true, data: carrier });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCarrier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const carrier = await shippingCarrierRepo.update(id, req.body);
    
    if (!carrier) {
      res.status(404).json({ success: false, message: 'Carrier not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: carrier });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCarrier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await shippingCarrierRepo.delete(id);
    
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Carrier not found' });
      return;
    }
    
    res.status(200).json({ success: true, message: 'Carrier deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Methods
// ============================================================================

export const getMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activeOnly, displayOnFrontend, carrierId } = req.query;
    
    const query = new GetShippingMethodsQuery(
      activeOnly === 'true',
      displayOnFrontend === 'true',
      carrierId as string | undefined
    );
    
    const result = await getShippingMethodsUseCase.execute(query);
    res.status(200).json({ success: result.success, data: result.methods, total: result.total });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMethodById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const method = await shippingMethodRepo.findById(id);
    
    if (!method) {
      res.status(404).json({ success: false, message: 'Method not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: method });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const method = await shippingMethodRepo.create(req.body);
    res.status(201).json({ success: true, data: method });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const method = await shippingMethodRepo.update(id, req.body);
    
    if (!method) {
      res.status(404).json({ success: false, message: 'Method not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: method });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await shippingMethodRepo.delete(id);
    
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Method not found' });
      return;
    }
    
    res.status(200).json({ success: true, message: 'Method deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Zones
// ============================================================================

export const getZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activeOnly } = req.query;
    const zones = await shippingZoneRepo.findAll(activeOnly === 'true');
    res.status(200).json({ success: true, data: zones });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getZoneById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const zone = await shippingZoneRepo.findById(id);
    
    if (!zone) {
      res.status(404).json({ success: false, message: 'Zone not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: zone });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const zone = await shippingZoneRepo.create(req.body);
    res.status(201).json({ success: true, data: zone });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const zone = await shippingZoneRepo.update(id, req.body);
    
    if (!zone) {
      res.status(404).json({ success: false, message: 'Zone not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: zone });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteZone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await shippingZoneRepo.delete(id);
    
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Zone not found' });
      return;
    }
    
    res.status(200).json({ success: true, message: 'Zone deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Rates
// ============================================================================

export const getRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { zoneId, methodId } = req.query;
    const rates = await shippingRateRepo.findActive(
      zoneId as string | undefined,
      methodId as string | undefined
    );
    res.status(200).json({ success: true, data: rates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const rate = await shippingRateRepo.findById(id);
    
    if (!rate) {
      res.status(404).json({ success: false, message: 'Rate not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: rate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const rate = await shippingRateRepo.create(req.body);
    res.status(201).json({ success: true, data: rate });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const rate = await shippingRateRepo.update(id, req.body);
    
    if (!rate) {
      res.status(404).json({ success: false, message: 'Rate not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: rate });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await shippingRateRepo.delete(id);
    
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Rate not found' });
      return;
    }
    
    res.status(200).json({ success: true, message: 'Rate deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Packaging Types
// ============================================================================

export const getPackagingTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activeOnly } = req.query;
    const types = await packagingTypeRepo.findAll(activeOnly === 'true');
    res.status(200).json({ success: true, data: types });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPackagingTypeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const type = await packagingTypeRepo.findById(id);
    
    if (!type) {
      res.status(404).json({ success: false, message: 'Packaging type not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: type });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPackagingType = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = await packagingTypeRepo.create(req.body);
    res.status(201).json({ success: true, data: type });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePackagingType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const type = await packagingTypeRepo.update(id, req.body);
    
    if (!type) {
      res.status(404).json({ success: false, message: 'Packaging type not found' });
      return;
    }
    
    res.status(200).json({ success: true, data: type });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePackagingType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await packagingTypeRepo.delete(id);
    
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Packaging type not found' });
      return;
    }
    
    res.status(200).json({ success: true, message: 'Packaging type deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Rate Calculation
// ============================================================================

export const calculateRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { destinationAddress, orderDetails } = req.body;
    
    if (!destinationAddress || !orderDetails) {
      res.status(400).json({ 
        success: false, 
        message: 'destinationAddress and orderDetails are required' 
      });
      return;
    }
    
    const command = new CalculateShippingRatesCommand(destinationAddress, orderDetails);
    const result = await calculateShippingRatesUseCase.execute(command);
    
    res.status(200).json({
      success: result.success,
      data: result.rates,
      zone: result.zone,
      message: result.message
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
