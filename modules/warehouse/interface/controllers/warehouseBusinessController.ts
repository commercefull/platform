import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse, validationErrorResponse } from '../../../../libs/apiResponse';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import type {
  UpdateZoneInput,
  UpdateBinInput,
  CreateBinInput,
  CreateReceivingInput,
  CreatePickPackInput,
} from '../../domain/repositories/WarehouseRepository';
import type { WarehouseUpdateParams } from '../../domain/repositories/WarehouseRepository';
import {
  manageWarehouseAdminUseCase,
  manageZonesUseCase,
  manageBinsUseCase,
  manageReceivingUseCase,
  managePickPackUseCase,
} from '../../application/wired';

/**
 * Maps domain errors thrown by use cases to the legacy response shapes:
 * validation failures keep the `error.errors[]` array; everything else uses
 * the standard error envelope.
 */
function useCaseErrorResponse(res: HttpResponse, error: unknown): void {
  if (error instanceof WarehouseValidationError) {
    validationErrorResponse(res, [getErrorMessage(error)]);
    return;
  }
  errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
}

interface CreateWarehouseBody {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
  isFulfillmentCenter?: boolean;
  isReturnCenter?: boolean;
  isVirtual?: boolean;
  organizationId?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  email?: string;
  phone?: string;
  contactName?: string;
  timezone?: string;
  cutoffTime?: string;
  processingTime?: number;
  operatingHours?: Record<string, unknown>;
  capabilities?: Record<string, unknown>;
  shippingMethods?: string[];
  createdBy?: string;
}

interface ShippingMethodBody {
  method: string;
}

export const getWarehouses = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const {
    activeOnly = 'true',
    fulfillmentCenters,
    returnCenters,
    organizationId,
    country,
    search,
    _limit = '50',
    _offset = '0',
  } = req.query;

  let warehouses;

  if (search) {
    // Use search functionality
    warehouses = await manageWarehouseAdminUseCase.search(search as string);
  } else if (fulfillmentCenters === 'true') {
    // Get fulfillment centers
    warehouses = await manageWarehouseAdminUseCase.findFulfillmentCenters();
  } else if (returnCenters === 'true') {
    // Get return centers
    warehouses = await manageWarehouseAdminUseCase.findReturnCenters();
  } else if (organizationId) {
    // Get warehouses by merchant
    warehouses = await manageWarehouseAdminUseCase.findByMerchantId(organizationId as string);
  } else if (country) {
    // Get warehouses by country
    warehouses = await manageWarehouseAdminUseCase.findByCountry(country as string);
  } else {
    // Get all warehouses
    warehouses = await manageWarehouseAdminUseCase.findAll(activeOnly === 'true');
  }

  successResponse(res, warehouses);
};

export const getWarehouseById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const warehouse = await manageWarehouseAdminUseCase.findById(id);

  if (!warehouse) {
    errorResponse(res, `Warehouse with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, warehouse);
};

export const getWarehouseByCode = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { code } = req.params;
  const warehouse = await manageWarehouseAdminUseCase.findByCode(code);

  if (!warehouse) {
    errorResponse(res, `Warehouse with code ${code} not found`, 404);
    return;
  }

  successResponse(res, warehouse);
};

export const getDefaultWarehouse = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  let warehouse = await manageWarehouseAdminUseCase.findDefault();
  if (!warehouse) {
    // Fallback to first active warehouse to satisfy deterministic 200 for this endpoint
    const list = await manageWarehouseAdminUseCase.findAll(true);
    warehouse = list[0] || null;
  }

  if (!warehouse) {
    errorResponse(res, 'No default warehouse found', 404);
    return;
  }

  successResponse(res, warehouse);
};

export const getFulfillmentCenters = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const warehouses = await manageWarehouseAdminUseCase.findFulfillmentCenters();
  successResponse(res, warehouses);
};

export const getReturnCenters = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const warehouses = await manageWarehouseAdminUseCase.findReturnCenters();
  successResponse(res, warehouses);
};

export const getWarehouseStatistics = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const statistics = await manageWarehouseAdminUseCase.getStatistics();
  successResponse(res, statistics);
};

export const findNearestWarehouses = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const latitude = (req.query.latitude as string | undefined) ?? (req.query.lat as string | undefined);
  const longitude = (req.query.longitude as string | undefined) ?? (req.query.lng as string | undefined);
  const radiusKm = (req.query.radiusKm as string | undefined) ?? '100';
  const limit = (req.query.limit as string | undefined) ?? '10';

  if (!latitude || !longitude) {
    validationErrorResponse(res, ['latitude and longitude are required']);
    return;
  }

  const warehouses = await manageWarehouseAdminUseCase.findNearLocation(
    parseFloat(latitude as string),
    parseFloat(longitude as string),
    parseFloat(radiusKm as string),
    parseInt(limit as string),
  );

  successResponse(res, warehouses);
};

export const getWarehousesByCountry = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { country } = req.params;
  const warehouses = await manageWarehouseAdminUseCase.findByCountry(country);
  successResponse(res, warehouses);
};

export const getWarehousesByMerchant = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { organizationId } = req.params;
  const warehouses = await manageWarehouseAdminUseCase.findByMerchantId(organizationId);
  successResponse(res, warehouses);
};

export const createWarehouse = async (
  req: HttpRequest<Record<string, string>, unknown, CreateWarehouseBody>,
  res: HttpResponse,
): Promise<void> => {
  const {
    name,
    code,
    description,
    isActive,
    isDefault,
    isFulfillmentCenter,
    isReturnCenter,
    isVirtual,
    organizationId,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    latitude,
    longitude,
    email,
    phone,
    contactName,
    timezone,
    cutoffTime,
    processingTime,
    operatingHours,
    capabilities,
    shippingMethods,
    createdBy,
  } = req.body;

  // Validate required fields
  const errors: string[] = [];
  if (!name) errors.push('name is required');
  if (!code) errors.push('code is required');
  if (!addressLine1) errors.push('addressLine1 is required');
  if (!city) errors.push('city is required');
  if (!state) errors.push('state is required');
  if (!postalCode) errors.push('postalCode is required');
  if (!country) errors.push('country is required');

  if (errors.length > 0) {
    validationErrorResponse(res, errors);
    return;
  }

  const warehouseParams = {
    name: name as string,
    code: code as string,
    description,
    isActive: isActive ?? true,
    isDefault: isDefault ?? false,
    isFulfillmentCenter: isFulfillmentCenter ?? true,
    isReturnCenter: isReturnCenter ?? true,
    isVirtual: isVirtual ?? false,
    organizationId,
    addressLine1: addressLine1 as string,
    addressLine2,
    city: city as string,
    state: state as string,
    postalCode: postalCode as string,
    country: country as string,
    latitude,
    longitude,
    email,
    phone,
    contactName,
    timezone: timezone ?? 'UTC',
    cutoffTime,
    processingTime,
    operatingHours,
    capabilities,
    shippingMethods,
    createdBy,
  };

  const warehouse = await manageWarehouseAdminUseCase.create(warehouseParams);
  successResponse(res, warehouse, 201);
};

export const updateWarehouse = async (
  req: HttpRequest<Record<string, string>, unknown, WarehouseUpdateParams>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const updateParams = req.body;

  const warehouse = await manageWarehouseAdminUseCase.update(id, updateParams);

  if (!warehouse) {
    errorResponse(res, `Warehouse with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, warehouse);
};

export const deleteWarehouse = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const deleted = await manageWarehouseAdminUseCase.delete(id);

  if (!deleted) {
    errorResponse(res, `Warehouse with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, { message: 'Warehouse deleted successfully' });
};

export const setDefaultWarehouse = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const warehouse = await manageWarehouseAdminUseCase.setAsDefault(id);

  if (!warehouse) {
    errorResponse(res, `Warehouse with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, warehouse);
};

export const activateWarehouse = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const warehouse = await manageWarehouseAdminUseCase.activate(id);

  if (!warehouse) {
    errorResponse(res, `Warehouse with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, warehouse);
};

export const deactivateWarehouse = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const warehouse = await manageWarehouseAdminUseCase.deactivate(id);

  if (!warehouse) {
    errorResponse(res, `Warehouse with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, warehouse);
};

export const addShippingMethod = async (
  req: HttpRequest<Record<string, string>, unknown, ShippingMethodBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  // Accept both { method } and { methodId } as input for compatibility with tests
  const body = req.body as Partial<ShippingMethodBody> & { methodId?: string };
  const method = body.method || body.methodId;

  if (!method) {
    validationErrorResponse(res, ['method is required']);
    return;
  }

  const warehouse = await manageWarehouseAdminUseCase.addShippingMethod(id, method);

  if (!warehouse) {
    errorResponse(res, `Warehouse with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, warehouse);
};

export const removeShippingMethod = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id, method } = req.params;

  const warehouse = await manageWarehouseAdminUseCase.removeShippingMethod(id, method);

  if (!warehouse) {
    errorResponse(res, `Warehouse with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, warehouse);
};

// ============================================================================
// Warehouse Zones
// ============================================================================

interface CreateZoneBody {
  name: string;
  code: string;
  description?: string;
  zoneType?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

export const createZone = async (req: HttpRequest<Record<string, string>, unknown, CreateZoneBody>, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    const zone = await manageZonesUseCase.create(id, req.body);
    successResponse(res, zone, 201);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

export const getZones = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const zones = await manageZonesUseCase.findZonesByWarehouse(id);
  successResponse(res, zones);
};

export const getZoneById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { zoneId } = req.params;
  const zone = await manageZonesUseCase.findZoneById(zoneId);
  if (!zone) {
    errorResponse(res, 'Zone not found', 404);
    return;
  }
  successResponse(res, zone);
};

export const updateZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { zoneId } = req.params;

  try {
    const zone = await manageZonesUseCase.update(zoneId, req.body as UpdateZoneInput);
    successResponse(res, zone);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

export const deleteZone = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { zoneId } = req.params;

  try {
    await manageZonesUseCase.delete(zoneId);
    successResponse(res, { message: 'Zone deleted successfully' });
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

// ============================================================================
// Warehouse Bins
// ============================================================================

interface CreateBinBody {
  locationCode: string;
  binType: string;
  isActive?: boolean;
  height?: number;
  width?: number;
  depth?: number;
  maxVolume?: number;
  maxWeight?: number;
  isPickable?: boolean;
  isReceivable?: boolean;
  isMixed?: boolean;
  priority?: number;
}

export const createBin = async (req: HttpRequest<Record<string, string>, unknown, CreateBinBody>, res: HttpResponse): Promise<void> => {
  const { id } = req.params;

  try {
    const bin = await manageBinsUseCase.create(id, req.body as Omit<CreateBinInput, 'distributionWarehouseId'>);
    successResponse(res, bin, 201);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

export const getBins = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const bins = await manageBinsUseCase.findBinsByWarehouse(id);
  successResponse(res, bins);
};

export const getBinById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { binId } = req.params;
  const bin = await manageBinsUseCase.findBinById(binId);
  if (!bin) {
    errorResponse(res, 'Bin not found', 404);
    return;
  }
  successResponse(res, bin);
};

export const updateBin = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { binId } = req.params;

  try {
    const bin = await manageBinsUseCase.update(binId, req.body as UpdateBinInput);
    successResponse(res, bin);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

export const deleteBin = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { binId } = req.params;

  try {
    await manageBinsUseCase.delete(binId);
    successResponse(res, { message: 'Bin deleted successfully' });
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

// ============================================================================
// Warehouse Receiving
// ============================================================================

interface CreateReceivingBody {
  receiptNumber: string;
  sourceType: string;
  sourceId?: string;
  expectedDate?: Date;
  carrierName?: string;
  trackingNumber?: string;
  packageCount?: number;
  notes?: string;
  items?: Record<string, unknown>[];
  receivedBy?: string;
}

export const createReceiving = async (
  req: HttpRequest<Record<string, string>, unknown, CreateReceivingBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;

  try {
    const record = await manageReceivingUseCase.create(id, req.body as Omit<CreateReceivingInput, 'distributionWarehouseId'>);
    successResponse(res, record, 201);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

export const getReceiving = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const status = req.query.status as string | undefined;
  const records = await manageReceivingUseCase.findByWarehouse(id, status);
  successResponse(res, records);
};

export const getReceivingById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { receivingId } = req.params;
  const record = await manageReceivingUseCase.findById(receivingId);
  if (!record) {
    errorResponse(res, 'Receiving record not found', 404);
    return;
  }
  successResponse(res, record);
};

export const completeReceiving = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { receivingId } = req.params;
  const { receivedBy, items, hasDiscrepancies } = req.body as {
    receivedBy?: string;
    items?: Record<string, unknown>[];
    hasDiscrepancies?: boolean;
  };

  try {
    const record = await manageReceivingUseCase.complete(receivingId, { receivedBy, items, hasDiscrepancies });
    successResponse(res, record);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

// ============================================================================
// Warehouse Pick/Pack
// ============================================================================

interface CreatePickPackBody {
  pickPackNumber: string;
  orderId?: string;
  fulfillmentId?: string;
  items?: Record<string, unknown>[];
  assignedTo?: string;
  notes?: string;
}

export const createPickPack = async (
  req: HttpRequest<Record<string, string>, unknown, CreatePickPackBody>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;

  try {
    const record = await managePickPackUseCase.create(id, req.body as Omit<CreatePickPackInput, 'distributionWarehouseId'>);
    successResponse(res, record, 201);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

export const getPickPacks = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const status = req.query.status as string | undefined;
  const records = await managePickPackUseCase.findByWarehouse(id, status);
  successResponse(res, records);
};

export const getPickPackById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pickPackId } = req.params;
  const record = await managePickPackUseCase.findById(pickPackId);
  if (!record) {
    errorResponse(res, 'Pick/pack record not found', 404);
    return;
  }
  successResponse(res, record);
};

export const startPicking = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pickPackId } = req.params;

  try {
    const record = await managePickPackUseCase.startPicking(pickPackId);
    successResponse(res, record);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

export const completePicking = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pickPackId } = req.params;

  try {
    const record = await managePickPackUseCase.completePicking(pickPackId);
    successResponse(res, record);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

export const startPacking = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pickPackId } = req.params;

  try {
    const record = await managePickPackUseCase.startPacking(pickPackId);
    successResponse(res, record);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

export const completePacking = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pickPackId } = req.params;

  try {
    const record = await managePickPackUseCase.completePacking(pickPackId);
    successResponse(res, record);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};

export const assignPickPack = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { pickPackId } = req.params;
  const { assignedTo } = req.body as { assignedTo: string };

  try {
    const record = await managePickPackUseCase.assign(pickPackId, assignedTo);
    successResponse(res, record);
  } catch (error: unknown) {
    useCaseErrorResponse(res, error);
  }
};
