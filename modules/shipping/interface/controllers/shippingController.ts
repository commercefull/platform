/**
 * Shipping Controller
 * Handles shipping-related HTTP requests
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import shippingConfigRepository from '../../infrastructure/repositories/ShippingConfigRepository';
import shippingLabelRepo from '../../infrastructure/repositories/ShippingLabelAggregateRepository';
import type { CreateShippingCarrierInput, UpdateShippingCarrierInput } from '../../infrastructure/repositories/ShippingConfigRepository';
import type { CreateShippingMethodInput, UpdateShippingMethodInput } from '../../infrastructure/repositories/ShippingConfigRepository';
import type { CreateShippingZoneInput, UpdateShippingZoneInput } from '../../infrastructure/repositories/ShippingConfigRepository';
import type { CreateShippingRateInput, UpdateShippingRateInput } from '../../infrastructure/repositories/ShippingConfigRepository';
import type { CreateShippingPackagingTypeInput, UpdateShippingPackagingTypeInput } from '../../infrastructure/repositories/ShippingConfigRepository';
import { CalculateShippingRatesCommand, calculateShippingRatesUseCase, ShippingAddress, OrderDetails } from '../../application/useCases/CalculateShippingRates';
import { GetShippingMethodsQuery, getShippingMethodsUseCase } from '../../application/useCases/GetShippingMethods';
import { createShippingLabelUseCase } from '../../application/useCases/CreateShippingLabel';
import { getShippingLabelUseCase } from '../../application/useCases/GetShippingLabel';
import { voidShippingLabelUseCase } from '../../application/useCases/VoidShippingLabel';
import { trackShipmentUseCase } from '../../application/useCases/TrackShipment';

const shippingCarrierRepo = shippingConfigRepository.carriers;
const shippingMethodRepo = shippingConfigRepository.methods;
const shippingZoneRepo = shippingConfigRepository.zones;
const shippingRateRepo = shippingConfigRepository.rates;
const packagingTypeRepo = shippingConfigRepository.packaging;

// ============================================================================
// Carriers
// ============================================================================

export const getCarriers = async (req: TypedRequest, res: Response): Promise<void> => {
  const { activeOnly } = req.query;
  const carriers = await shippingCarrierRepo.findAll(activeOnly === 'true');
  res.status(200).json({ success: true, data: carriers });
  
};

export const getCarrierById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const carrier = await shippingCarrierRepo.findById(id);

  if (!carrier) {
    res.status(404).json({ success: false, message: 'Carrier not found' });
    return;
  }

  res.status(200).json({ success: true, data: carrier });
  
};

export const createCarrier = async (req: TypedRequest<Record<string, string>, unknown, CreateShippingCarrierInput>, res: Response): Promise<void> => {
  const carrier = await shippingCarrierRepo.create(req.body);
  res.status(201).json({ success: true, data: carrier });
  
};

export const updateCarrier = async (req: TypedRequest<Record<string, string>, unknown, UpdateShippingCarrierInput>, res: Response): Promise<void> => {
  const { id } = req.params;
  const carrier = await shippingCarrierRepo.update(id, req.body);

  if (!carrier) {
    res.status(404).json({ success: false, message: 'Carrier not found' });
    return;
  }

  res.status(200).json({ success: true, data: carrier });
  
};

export const deleteCarrier = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = await shippingCarrierRepo.delete(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Carrier not found' });
    return;
  }

  res.status(200).json({ success: true, message: 'Carrier deleted successfully' });
  
};

// ============================================================================
// Methods
// ============================================================================

export const getMethods = async (req: TypedRequest, res: Response): Promise<void> => {
  const { activeOnly, displayOnFrontend, carrierId } = req.query;

  const query = new GetShippingMethodsQuery(activeOnly === 'true', displayOnFrontend === 'true', carrierId as string | undefined);

  const result = await getShippingMethodsUseCase.execute(query);
  res.status(200).json({ success: result.success, data: result.methods, total: result.total });
  
};

export const getMethodById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const method = await shippingMethodRepo.findById(id);

  if (!method) {
    res.status(404).json({ success: false, message: 'Method not found' });
    return;
  }

  res.status(200).json({ success: true, data: method });
  
};

export const createMethod = async (req: TypedRequest<Record<string, string>, unknown, CreateShippingMethodInput>, res: Response): Promise<void> => {
  const method = await shippingMethodRepo.create(req.body);
  res.status(201).json({ success: true, data: method });
  
};

export const updateMethod = async (req: TypedRequest<Record<string, string>, unknown, UpdateShippingMethodInput>, res: Response): Promise<void> => {
  const { id } = req.params;
  const method = await shippingMethodRepo.update(id, req.body);

  if (!method) {
    res.status(404).json({ success: false, message: 'Method not found' });
    return;
  }

  res.status(200).json({ success: true, data: method });
  
};

export const deleteMethod = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = await shippingMethodRepo.delete(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Method not found' });
    return;
  }

  res.status(200).json({ success: true, message: 'Method deleted successfully' });
  
};

// ============================================================================
// Zones
// ============================================================================

export const getZones = async (req: TypedRequest, res: Response): Promise<void> => {
  const { activeOnly } = req.query;
  const zones = await shippingZoneRepo.findAll(activeOnly === 'true');
  res.status(200).json({ success: true, data: zones });
  
};

export const getZoneById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const zone = await shippingZoneRepo.findById(id);

  if (!zone) {
    res.status(404).json({ success: false, message: 'Zone not found' });
    return;
  }

  res.status(200).json({ success: true, data: zone });
  
};

export const createZone = async (req: TypedRequest<Record<string, string>, unknown, CreateShippingZoneInput>, res: Response): Promise<void> => {
  const zone = await shippingZoneRepo.create(req.body);
  res.status(201).json({ success: true, data: zone });
  
};

export const updateZone = async (req: TypedRequest<Record<string, string>, unknown, UpdateShippingZoneInput>, res: Response): Promise<void> => {
  const { id } = req.params;
  const zone = await shippingZoneRepo.update(id, req.body);

  if (!zone) {
    res.status(404).json({ success: false, message: 'Zone not found' });
    return;
  }

  res.status(200).json({ success: true, data: zone });
  
};

export const deleteZone = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = await shippingZoneRepo.delete(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Zone not found' });
    return;
  }

  res.status(200).json({ success: true, message: 'Zone deleted successfully' });
  
};

// ============================================================================
// Rates
// ============================================================================

export const getRates = async (req: TypedRequest, res: Response): Promise<void> => {
  const { zoneId, methodId } = req.query;
  const rates = await shippingRateRepo.findActive(zoneId as string | undefined, methodId as string | undefined);
  res.status(200).json({ success: true, data: rates });
  
};

export const getRateById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const rate = await shippingRateRepo.findById(id);

  if (!rate) {
    res.status(404).json({ success: false, message: 'Rate not found' });
    return;
  }

  res.status(200).json({ success: true, data: rate });
  
};

export const createRate = async (req: TypedRequest<Record<string, string>, unknown, CreateShippingRateInput>, res: Response): Promise<void> => {
  const rate = await shippingRateRepo.create(req.body);
  res.status(201).json({ success: true, data: rate });
  
};

export const updateRate = async (req: TypedRequest<Record<string, string>, unknown, UpdateShippingRateInput>, res: Response): Promise<void> => {
  const { id } = req.params;
  const rate = await shippingRateRepo.update(id, req.body);

  if (!rate) {
    res.status(404).json({ success: false, message: 'Rate not found' });
    return;
  }

  res.status(200).json({ success: true, data: rate });
  
};

export const deleteRate = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = await shippingRateRepo.delete(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Rate not found' });
    return;
  }

  res.status(200).json({ success: true, message: 'Rate deleted successfully' });
  
};

// ============================================================================
// Packaging Types
// ============================================================================

export const getPackagingTypes = async (req: TypedRequest, res: Response): Promise<void> => {
  const { activeOnly } = req.query;
  const types = await packagingTypeRepo.findAll(activeOnly === 'true');
  res.status(200).json({ success: true, data: types });
  
};

export const getPackagingTypeById = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const type = await packagingTypeRepo.findById(id);

  if (!type) {
    res.status(404).json({ success: false, message: 'Packaging type not found' });
    return;
  }

  res.status(200).json({ success: true, data: type });
  
};

export const createPackagingType = async (req: TypedRequest<Record<string, string>, unknown, CreateShippingPackagingTypeInput>, res: Response): Promise<void> => {
  const type = await packagingTypeRepo.create(req.body);
  res.status(201).json({ success: true, data: type });
  
};

export const updatePackagingType = async (req: TypedRequest<Record<string, string>, unknown, UpdateShippingPackagingTypeInput>, res: Response): Promise<void> => {
  const { id } = req.params;
  const type = await packagingTypeRepo.update(id, req.body);

  if (!type) {
    res.status(404).json({ success: false, message: 'Packaging type not found' });
    return;
  }

  res.status(200).json({ success: true, data: type });
  
};

export const deletePackagingType = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const deleted = await packagingTypeRepo.delete(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Packaging type not found' });
    return;
  }

  res.status(200).json({ success: true, message: 'Packaging type deleted successfully' });
  
};

// ============================================================================
// Rate Calculation
// ============================================================================

interface EstimateDeliveryBody {
  methodId: string;
  destinationAddress?: ShippingAddress;
}

export const estimateDelivery = async (req: TypedRequest<Record<string, string>, unknown, EstimateDeliveryBody>, res: Response): Promise<void> => {
  const { methodId, destinationAddress } = req.body;

  if (!methodId) {
    res.status(400).json({ success: false, message: 'methodId is required' });
    return;
  }

  const method = await shippingMethodRepo.findById(methodId);
  if (!method) {
    res.status(404).json({ success: false, message: 'Shipping method not found' });
    return;
  }

  // estimatedDeliveryDays may be stored as JSON { min, max } or a number
  const deliveryDays = method.estimatedDeliveryDays as { min?: number; max?: number } | number | null;
  const handlingDays = method.handlingDays || 0;

  let daysMin = handlingDays;
  let daysMax = handlingDays;

  if (typeof deliveryDays === 'number') {
    daysMin += deliveryDays;
    daysMax += deliveryDays;
  } else if (deliveryDays && typeof deliveryDays === 'object') {
    daysMin += deliveryDays.min || 0;
    daysMax += deliveryDays.max || deliveryDays.min || 0;
  }

  const now = new Date();
  const minDate = new Date(now);
  const maxDate = new Date(now);
  minDate.setDate(minDate.getDate() + daysMin);
  maxDate.setDate(maxDate.getDate() + daysMax);

  res.status(200).json({
    success: true,
    data: {
      methodId: method.shippingMethodId,
      methodName: method.name,
      estimatedDaysMin: daysMin,
      estimatedDaysMax: daysMax,
      estimatedDeliveryMin: minDate.toISOString(),
      estimatedDeliveryMax: maxDate.toISOString(),
      handlingDays,
      destinationAddress,
    },
  });
  
};

interface CalculateRatesBody {
  destinationAddress: ShippingAddress;
  orderDetails: OrderDetails;
}

export const calculateRates = async (req: TypedRequest<Record<string, string>, unknown, CalculateRatesBody>, res: Response): Promise<void> => {
  const { destinationAddress, orderDetails } = req.body;

  if (!destinationAddress || !orderDetails) {
    res.status(400).json({
      success: false,
      message: 'destinationAddress and orderDetails are required',
    });
    return;
  }

  const command = new CalculateShippingRatesCommand(destinationAddress, orderDetails);
  const result = await calculateShippingRatesUseCase.execute(command);

  res.status(200).json({
    success: result.success,
    data: result.rates,
    zone: result.zone,
    message: result.message,
  });
  
};

// ============================================================================
// Shipping Labels
// ============================================================================

interface CreateLabelBody {
  shippingCarrierId: string;
  carrierService?: string;
  orderId?: string;
  fulfillmentId?: string;
  trackingNumber: string;
  labelUrl?: string;
  labelFormat?: string;
  shipFromName?: string;
  shipToName?: string;
  shipToAddressLine1?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToPostalCode?: string;
  shipToCountry?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  shippingCost?: number;
}

export const createLabel = async (req: TypedRequest<Record<string, string>, unknown, CreateLabelBody>, res: Response): Promise<void> => {
  const result = await createShippingLabelUseCase.execute(req.body);
  res.status(201).json({ success: true, data: result });
  
};

export const getLabel = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await getShippingLabelUseCase.execute({
    shippingLabelId: req.params.id,
    trackingNumber: req.query.trackingNumber as string | undefined,
  });
  if (!result.found) {
    res.status(404).json({ success: false, message: 'Shipping label not found' });
    return;
  }
  res.status(200).json({ success: true, data: result.label });
  
};

export const getLabelsByOrder = async (req: TypedRequest, res: Response): Promise<void> => {
  const { orderId } = req.params;
  const labels = await shippingLabelRepo.findByOrderId(orderId);
  res.status(200).json({ success: true, data: labels });
  
};

export const voidLabel = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body as { reason?: string };
  const result = await voidShippingLabelUseCase.execute({ shippingLabelId: id, reason });
  if (!result.voided) {
    res.status(404).json({ success: false, message: 'Label not found or already voided' });
    return;
  }
  res.status(200).json({ success: true, data: result.label });
  
};

// ============================================================================
// Tracking
// ============================================================================

export const trackShipment = async (req: TypedRequest, res: Response): Promise<void> => {
  const result = await trackShipmentUseCase.execute({
    shippingLabelId: req.params.id,
    trackingNumber: req.query.trackingNumber as string | undefined,
  });
  if (!result.found) {
    res.status(404).json({ success: false, message: 'Tracking info not found' });
    return;
  }
  res.status(200).json({ success: true, data: result.tracking });
  
};
