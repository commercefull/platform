/**
 * Warehouse ops business controller — bins, receiving, and pick/pack handlers.
 * Split from warehouseBusinessController.ts for file size; re-exported there.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { useCaseErrorResponse } from './warehouseControllerShared';
import type {
  UpdateBinInput,
  CreateBinInput,
  CreateReceivingInput,
  CreatePickPackInput,
} from '../../domain/repositories/WarehouseRepository';
import { manageBinsUseCase, manageReceivingUseCase, managePickPackUseCase } from '../../application/wired';

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
