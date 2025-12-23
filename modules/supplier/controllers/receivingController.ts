import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import ReceivingRecordRepo from '../repos/receivingRecordRepo';
import ReceivingItemRepo from '../repos/receivingItemRepo';
import PurchaseOrderRepo from '../repos/purchaseOrderRepo';
import { successResponse, errorResponse, validationErrorResponse } from '../../../libs/apiResponse';

// Use the singleton instances directly
const receivingRecordRepo = ReceivingRecordRepo;
const receivingItemRepo = ReceivingItemRepo;
const purchaseOrderRepo = PurchaseOrderRepo;

// ---------- Receiving Record Methods ----------

export const getReceivingRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, warehouseId, supplierId, limit = '50' } = req.query;

    let receivingRecords;

    if (status) {
      receivingRecords = await receivingRecordRepo.findByStatus(status as any, parseInt(limit as string));
    } else if (warehouseId) {
      receivingRecords = await receivingRecordRepo.findByWarehouseId(warehouseId as string, parseInt(limit as string));
    } else if (supplierId) {
      receivingRecords = await receivingRecordRepo.findBySupplierId(supplierId as string, parseInt(limit as string));
    } else {
      // TODO: Implement findAll method if needed
      receivingRecords = await receivingRecordRepo.findByStatus('pending', parseInt(limit as string));
    }

    successResponse(res, receivingRecords);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch receiving records');
  }
};

export const getReceivingRecordById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const receivingRecord = await receivingRecordRepo.findById(id);

    if (!receivingRecord) {
      errorResponse(res, `Receiving record with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, receivingRecord);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch receiving record');
  }
};

export const getReceivingByPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const receivingRecords = await receivingRecordRepo.findByPurchaseOrderId(id);
    successResponse(res, receivingRecords);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch receiving records');
  }
};

export const createReceivingRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      purchaseOrderId,
      warehouseId,
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
    } = req.body;

    // Validate required fields
    const errors: string[] = [];
    if (!warehouseId) errors.push('warehouseId is required');
    if (!supplierId) errors.push('supplierId is required');
    if (!items || !Array.isArray(items) || items.length === 0) errors.push('items array is required and must not be empty');

    if (errors.length > 0) {
      validationErrorResponse(res, errors);
      return;
    }

    // Create receiving record
    const recordParams = {
      purchaseOrderId,
      warehouseId,
      supplierId,
      status,
      receivedDate,
      carrierName,
      trackingNumber,
      packageCount,
      notes,
      discrepancies,
      attachments,
    };

    const receivingRecord = await receivingRecordRepo.create(recordParams);

    // Create receiving items
    const createdItems = [];
    for (const item of items) {
      const itemParams = {
        supplierReceivingRecordId: receivingRecord.supplierReceivingRecordId,
        ...item,
      };
      const createdItem = await receivingItemRepo.create(itemParams);
      createdItems.push(createdItem);
    }

    successResponse(
      res,
      {
        receivingRecord,
        items: createdItems,
      },
      201,
    );
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to create receiving record');
  }
};

export const updateReceivingRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateParams = req.body;

    const receivingRecord = await receivingRecordRepo.update(id, updateParams);

    if (!receivingRecord) {
      errorResponse(res, `Receiving record with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, receivingRecord);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update receiving record');
  }
};

export const completeReceiving = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const receivingRecord = await receivingRecordRepo.complete(id);

    if (!receivingRecord) {
      errorResponse(res, `Receiving record with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, receivingRecord);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to complete receiving record');
  }
};

// ---------- Receiving Item Methods ----------

export const getReceivingItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const items = await receivingItemRepo.findByReceivingRecordId(id);
    successResponse(res, items);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to fetch receiving items');
  }
};

export const createReceivingItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const itemParams = {
      receivingRecordId: id,
      ...req.body,
    };

    // Validate required fields
    const errors: string[] = [];
    if (!itemParams.productId) errors.push('productId is required');
    if (!itemParams.sku) errors.push('sku is required');
    if (!itemParams.name) errors.push('name is required');
    if (!itemParams.receivedQuantity || itemParams.receivedQuantity < 0) errors.push('receivedQuantity must be non-negative');

    if (errors.length > 0) {
      validationErrorResponse(res, errors);
      return;
    }

    const item = await receivingItemRepo.create(itemParams);
    successResponse(res, item, 201);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to create receiving item');
  }
};

export const updateReceivingItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateParams = req.body;

    const item = await receivingItemRepo.update(id, updateParams);

    if (!item) {
      errorResponse(res, `Receiving item with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, item);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to update receiving item');
  }
};

export const acceptReceivingItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { processedBy } = req.body;

    const item = await receivingItemRepo.accept(id, processedBy);

    if (!item) {
      errorResponse(res, `Receiving item with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, item);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to accept receiving item');
  }
};

export const rejectReceivingItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, processedBy } = req.body;

    if (!reason) {
      validationErrorResponse(res, ['reason is required']);
      return;
    }

    const item = await receivingItemRepo.reject(id, reason, processedBy);

    if (!item) {
      errorResponse(res, `Receiving item with ID ${id} not found`, 404);
      return;
    }

    successResponse(res, item);
  } catch (error: any) {
    logger.error('Error:', error);

    errorResponse(res, 'Failed to reject receiving item');
  }
};
