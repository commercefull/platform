/**
 * Shipping Controller
 * Handles shipping-related HTTP requests
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';
import { CalculateShippingRatesCommand, ShippingAddress, OrderDetails } from '../../application/useCases/CalculateShippingRates';
import { GetShippingMethodsQuery } from '../../application/useCases/GetShippingMethods';
import {
  calculateShippingRatesUseCase,
  getShippingMethodsUseCase,
  createShippingLabelUseCase,
  getShippingLabelUseCase,
  voidShippingLabelUseCase,
  trackShipmentUseCase,
  estimateDeliveryWindowUseCase,
  manageShippingMethodsUseCase,
  manageShippingZonesUseCase,
  manageShippingRatesUseCase,
  manageShippingConfigurationUseCase,
} from '../../application/wired';
import {
  CreateShippingCarrierInput,
  UpdateShippingCarrierInput,
  CreateShippingMethodInput,
  UpdateShippingMethodInput,
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
  CreateShippingRateInput,
  UpdateShippingRateInput,
  CreateShippingPackagingTypeInput,
  UpdateShippingPackagingTypeInput,
} from '../../application/wired';
import type { CreateShippingSurchargeInput, UpdateShippingSurchargeInput } from '../../application/wired';



// ============================================================================
// Carriers
// ============================================================================

export const getCarriers = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { activeOnly } = req.query;
  const carriers = await manageShippingConfigurationUseCase.listCarriers(activeOnly === 'true');
  res.status(200).json({ success: true, data: carriers });
};

export const getCarrierById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const carrier = await manageShippingConfigurationUseCase.findCarrierById(id);

  if (!carrier) {
    res.status(404).json({ success: false, message: 'Carrier not found' });
    return;
  }

  res.status(200).json({ success: true, data: carrier });
};

export const createCarrier = async (
  req: HttpRequest<Record<string, string>, unknown, CreateShippingCarrierInput>,
  res: HttpResponse,
): Promise<void> => {
  const carrier = await manageShippingConfigurationUseCase.createCarrier(req.body);
  res.status(201).json({ success: true, data: carrier });
};

export const updateCarrier = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateShippingCarrierInput>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const carrier = await manageShippingConfigurationUseCase.updateCarrier(id, req.body);

  if (!carrier) {
    res.status(404).json({ success: false, message: 'Carrier not found' });
    return;
  }

  res.status(200).json({ success: true, data: carrier });
};

export const deleteCarrier = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const deleted = await manageShippingConfigurationUseCase.deleteCarrier(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Carrier not found' });
    return;
  }

  res.status(200).json({ success: true, message: 'Carrier deleted successfully' });
};

// ============================================================================
// Methods
// ============================================================================

export const getMethods = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { activeOnly, displayOnFrontend, carrierId } = req.query;

  const query = new GetShippingMethodsQuery(activeOnly === 'true', displayOnFrontend === 'true', carrierId as string | undefined);

  const result = await getShippingMethodsUseCase.execute(query);
  res.status(200).json({ success: result.success, data: result.methods, total: result.total });
};

export const getMethodById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const method = await manageShippingMethodsUseCase.findById(id);

  if (!method) {
    res.status(404).json({ success: false, message: 'Method not found' });
    return;
  }

  res.status(200).json({ success: true, data: method });
};

export const createMethod = async (
  req: HttpRequest<Record<string, string>, unknown, CreateShippingMethodInput>,
  res: HttpResponse,
): Promise<void> => {
  const method = await manageShippingMethodsUseCase.create(req.body);
  res.status(201).json({ success: true, data: method });
};

export const updateMethod = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateShippingMethodInput>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const method = await manageShippingMethodsUseCase.update(id, req.body);

  if (!method) {
    res.status(404).json({ success: false, message: 'Method not found' });
    return;
  }

  res.status(200).json({ success: true, data: method });
};

export const deleteMethod = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const deleted = await manageShippingMethodsUseCase.delete(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Method not found' });
    return;
  }

  res.status(200).json({ success: true, message: 'Method deleted successfully' });
};

// ============================================================================
// Zones
// ============================================================================

export const getZones = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { activeOnly } = req.query;
  const zones = await manageShippingZonesUseCase.findAll(activeOnly === 'true');
  res.status(200).json({ success: true, data: zones });
};

export const getZoneById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const zone = await manageShippingZonesUseCase.findById(id);

  if (!zone) {
    res.status(404).json({ success: false, message: 'Zone not found' });
    return;
  }

  res.status(200).json({ success: true, data: zone });
};

export const createZone = async (
  req: HttpRequest<Record<string, string>, unknown, CreateShippingZoneInput>,
  res: HttpResponse,
): Promise<void> => {
  const zone = await manageShippingZonesUseCase.create(req.body);
  res.status(201).json({ success: true, data: zone });
};

export const updateZone = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateShippingZoneInput>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const zone = await manageShippingZonesUseCase.update(id, req.body);

  if (!zone) {
    res.status(404).json({ success: false, message: 'Zone not found' });
    return;
  }

  res.status(200).json({ success: true, data: zone });
};

export const deleteZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const deleted = await manageShippingZonesUseCase.delete(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Zone not found' });
    return;
  }

  res.status(200).json({ success: true, message: 'Zone deleted successfully' });
};

// ============================================================================
// Rates
// ============================================================================

export const getRates = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { zoneId, methodId } = req.query;
  const rates = await manageShippingRatesUseCase.findActive(zoneId as string | undefined, methodId as string | undefined);
  res.status(200).json({ success: true, data: rates });
};

export const getRateById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const rate = await manageShippingRatesUseCase.findById(id);

  if (!rate) {
    res.status(404).json({ success: false, message: 'Rate not found' });
    return;
  }

  res.status(200).json({ success: true, data: rate });
};

export const createRate = async (
  req: HttpRequest<Record<string, string>, unknown, CreateShippingRateInput>,
  res: HttpResponse,
): Promise<void> => {
  const rate = await manageShippingRatesUseCase.create(req.body);
  res.status(201).json({ success: true, data: rate });
};

export const updateRate = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateShippingRateInput>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const rate = await manageShippingRatesUseCase.update(id, req.body);

  if (!rate) {
    res.status(404).json({ success: false, message: 'Rate not found' });
    return;
  }

  res.status(200).json({ success: true, data: rate });
};

export const deleteRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const deleted = await manageShippingRatesUseCase.delete(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Rate not found' });
    return;
  }

  res.status(200).json({ success: true, message: 'Rate deleted successfully' });
};

// ============================================================================
// Packaging Types
// ============================================================================

export const getPackagingTypes = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { activeOnly } = req.query;
  const types = await manageShippingConfigurationUseCase.listPackagingTypes(activeOnly === 'true');
  res.status(200).json({ success: true, data: types });
};

export const getPackagingTypeById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const type = await manageShippingConfigurationUseCase.findPackagingTypeById(id);

  if (!type) {
    res.status(404).json({ success: false, message: 'Packaging type not found' });
    return;
  }

  res.status(200).json({ success: true, data: type });
};

export const createPackagingType = async (
  req: HttpRequest<Record<string, string>, unknown, CreateShippingPackagingTypeInput>,
  res: HttpResponse,
): Promise<void> => {
  const type = await manageShippingConfigurationUseCase.createPackagingType(req.body);
  res.status(201).json({ success: true, data: type });
};

export const updatePackagingType = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateShippingPackagingTypeInput>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const type = await manageShippingConfigurationUseCase.updatePackagingType(id, req.body);

  if (!type) {
    res.status(404).json({ success: false, message: 'Packaging type not found' });
    return;
  }

  res.status(200).json({ success: true, data: type });
};

export const deletePackagingType = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const deleted = await manageShippingConfigurationUseCase.deletePackagingType(id);

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

export const estimateDelivery = async (
  req: HttpRequest<Record<string, string>, unknown, EstimateDeliveryBody>,
  res: HttpResponse,
): Promise<void> => {
  try {
    const result = await estimateDeliveryWindowUseCase.execute(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error: unknown) {
    const status = getErrorStatusCode(error);
    res.status(status).json({ success: false, message: getErrorMessage(error) });
  }
};

interface CalculateRatesBody {
  destinationAddress: ShippingAddress;
  orderDetails: OrderDetails;
}

export const calculateRates = async (
  req: HttpRequest<Record<string, string>, unknown, CalculateRatesBody>,
  res: HttpResponse,
): Promise<void> => {
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

export const createLabel = async (req: HttpRequest<Record<string, string>, unknown, CreateLabelBody>, res: HttpResponse): Promise<void> => {
  const result = await createShippingLabelUseCase.execute(req.body);
  res.status(201).json({ success: true, data: result });
};

export const getLabel = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const getLabelsByOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { orderId } = req.params;
  const labels = await getShippingLabelUseCase.findByOrderId(orderId);
  res.status(200).json({ success: true, data: labels });
};

export const voidLabel = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const trackShipment = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

// ============================================================================
// Surcharges
// ============================================================================

export const getSurchargesByRate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { rateId } = req.params;
  const { activeOnly } = req.query;
  const surcharges = await manageShippingConfigurationUseCase.listSurchargesByRate(rateId, activeOnly !== 'false');
  res.status(200).json({ success: true, data: surcharges });
};

export const getSurchargeById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const surcharge = await manageShippingConfigurationUseCase.findSurchargeById(id);
  if (!surcharge) {
    res.status(404).json({ success: false, message: 'Surcharge not found' });
    return;
  }
  res.status(200).json({ success: true, data: surcharge });
};

export const createSurcharge = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const surcharge = await manageShippingConfigurationUseCase.createSurcharge(req.body as CreateShippingSurchargeInput);
    res.status(201).json({ success: true, data: surcharge });
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

export const updateSurcharge = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const input = req.body as UpdateShippingSurchargeInput;
  const surcharge = await manageShippingConfigurationUseCase.updateSurcharge(id, input);
  if (!surcharge) {
    res.status(404).json({ success: false, message: 'Surcharge not found' });
    return;
  }
  res.status(200).json({ success: true, data: surcharge });
};

export const deleteSurcharge = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const deleted = await manageShippingConfigurationUseCase.deleteSurcharge(id);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Surcharge not found' });
    return;
  }
  res.status(200).json({ success: true, message: 'Surcharge deleted' });
};
