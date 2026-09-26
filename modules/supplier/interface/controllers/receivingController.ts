import type { HttpRequest, HttpResponse } from 'libs/http';
import { successResponse, errorResponse, validationErrorResponse } from '../../../../libs/apiResponse';
import { createReceivingRecordUseCase, manageReceivingUseCase } from '../../application/wired';
import { CreateReceivingRecordInput } from '../../application/useCases/CreateReceivingRecord';
import { SupplierValidationError } from '../../domain/errors/SupplierErrors';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import {
  SupplierReceivingRecordCreateParams,
  SupplierReceivingRecordUpdateParams,
  SupplierReceivingItemCreateParams,
  SupplierReceivingItemUpdateParams,
} from '../../application/wired';

function respondValidationOrError(res: HttpResponse, error: unknown): void {
  if (error instanceof SupplierValidationError) {
    validationErrorResponse(res, getErrorMessage(error).split('; '));
    return;
  }
  res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
}

// ---------- Receiving Record Methods ----------

export const getReceivingRecords = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { status, warehouseId, supplierId, limit = '50' } = req.query;

  const receivingRecords = await manageReceivingUseCase.listReceivingRecords({
    status: status as string | undefined,
    warehouseId: warehouseId as string | undefined,
    supplierId: supplierId as string | undefined,
    limit: parseInt(limit as string),
  });

  successResponse(res, receivingRecords);
};

export const getReceivingRecordById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const receivingRecord = await manageReceivingUseCase.getReceivingRecord(id);

  if (!receivingRecord) {
    errorResponse(res, `Receiving record with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, receivingRecord);
};

export const getReceivingByPurchaseOrder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const receivingRecords = await manageReceivingUseCase.getByPurchaseOrder(id);
  successResponse(res, receivingRecords);
};

export const createReceivingRecord = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const {
    supplierPurchaseOrderId,
    distributionWarehouseId,
    supplierId,
    status,
    receivedDate,
    carrierName,
    trackingNumber,
    packageCount,
    notes,
    discrepancies,
    attachments,
    items, // Array of receiving items
  } = req.body as SupplierReceivingRecordCreateParams & { items: SupplierReceivingItemCreateParams[] };

  try {
    const result = await createReceivingRecordUseCase.execute({
      supplierPurchaseOrderId,
      distributionWarehouseId,
      supplierId,
      status,
      receivedDate,
      carrierName,
      trackingNumber,
      packageCount,
      notes,
      discrepancies,
      attachments,
      items,
    } as CreateReceivingRecordInput);

    successResponse(
      res,
      {
        receivingRecord: result.receivingRecord,
        items: result.items,
      },
      201,
    );
  } catch (error) {
    respondValidationOrError(res, error);
  }
};

export const updateReceivingRecord = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const updateParams = req.body as SupplierReceivingRecordUpdateParams;

  const receivingRecord = await manageReceivingUseCase.updateReceivingRecord(id, updateParams as Record<string, unknown>);

  if (!receivingRecord) {
    errorResponse(res, `Receiving record with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, receivingRecord);
};

export const completeReceiving = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const receivingRecord = await manageReceivingUseCase.completeReceiving(id);

  if (!receivingRecord) {
    errorResponse(res, `Receiving record with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, receivingRecord);
};

// ---------- Receiving Item Methods ----------

export const getReceivingItems = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const items = await manageReceivingUseCase.getItems(id);
  successResponse(res, items);
};

export const createReceivingItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const body = req.body as Omit<SupplierReceivingItemCreateParams, 'supplierReceivingRecordId'>;

  try {
    const item = await manageReceivingUseCase.createItem(id, body);
    successResponse(res, item, 201);
  } catch (error) {
    respondValidationOrError(res, error);
  }
};

export const updateReceivingItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const updateParams = req.body as SupplierReceivingItemUpdateParams;

  const item = await manageReceivingUseCase.updateItem(id, updateParams as Record<string, unknown>);

  if (!item) {
    errorResponse(res, `Receiving item with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, item);
};

export const acceptReceivingItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const { processedBy } = req.body as { processedBy?: string };

  const item = await manageReceivingUseCase.acceptItem(id, processedBy);

  if (!item) {
    errorResponse(res, `Receiving item with ID ${id} not found`, 404);
    return;
  }

  successResponse(res, item);
};

export const rejectReceivingItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const { reason, processedBy } = req.body as { reason?: string; processedBy?: string };

  try {
    const item = await manageReceivingUseCase.rejectItem(id, reason, processedBy);

    if (!item) {
      errorResponse(res, `Receiving item with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, item);
  } catch (error) {
    respondValidationOrError(res, error);
  }
};
