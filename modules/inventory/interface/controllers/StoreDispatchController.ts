import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../../libs/logger';
import InventoryRepository from '../../infrastructure/repositories/InventoryRepository';
import storeDispatchRepository from '../../infrastructure/repositories/StoreDispatchRepository';
import { CreateStoreDispatchUseCase } from '../../application/useCases/CreateStoreDispatch';
import { ListStoreDispatchesUseCase } from '../../application/useCases/ListStoreDispatches';
import { GetStoreDispatchUseCase } from '../../application/useCases/GetStoreDispatch';
import { ApproveStoreDispatchUseCase } from '../../application/useCases/ApproveStoreDispatch';
import { DispatchFromStoreUseCase } from '../../application/useCases/DispatchFromStore';
import { ReceiveStoreDispatchUseCase } from '../../application/useCases/ReceiveStoreDispatch';
import { CancelStoreDispatchUseCase } from '../../application/useCases/CancelStoreDispatch';

function respond(res: Response, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

export const createStoreDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new CreateStoreDispatchUseCase(storeDispatchRepository, InventoryRepository);
    const result = await useCase.execute({
      fromStoreId: req.body.fromStoreId,
      toStoreId: req.body.toStoreId,
      items: req.body.items || [],
      notes: req.body.notes,
      requestedBy: req.user?.userId || req.user?.id || req.body.requestedBy,
    });

    respond(res, result, 201);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(res, error.message || 'Failed to create dispatch', 400);
  }
};

export const listStoreDispatches = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new ListStoreDispatchesUseCase(storeDispatchRepository);
    const result = await useCase.execute({
      fromStoreId: req.query.fromStoreId as string | undefined,
      toStoreId: req.query.toStoreId as string | undefined,
      status: req.query.status as any,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    });

    respond(res, result);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(res, error.message || 'Failed to list dispatches');
  }
};

export const getStoreDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new GetStoreDispatchUseCase(storeDispatchRepository);
    const result = await useCase.execute(req.params.dispatchId);

    if (!result) {
      respondError(res, 'Dispatch not found', 404);
      return;
    }

    respond(res, result);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(res, error.message || 'Failed to get dispatch');
  }
};

export const approveStoreDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new ApproveStoreDispatchUseCase(storeDispatchRepository, InventoryRepository);
    const result = await useCase.execute(req.params.dispatchId, req.user?.userId || req.user?.id || req.body.approvedBy);
    respond(res, result);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(res, error.message || 'Failed to approve dispatch', 400);
  }
};

export const dispatchFromStore = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new DispatchFromStoreUseCase(storeDispatchRepository, InventoryRepository);
    const result = await useCase.execute(
      req.params.dispatchId,
      req.user?.userId || req.user?.id || req.body.dispatchedBy,
      req.body.items,
    );
    respond(res, result);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(res, error.message || 'Failed to dispatch stock', 400);
  }
};

export const receiveStoreDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new ReceiveStoreDispatchUseCase(storeDispatchRepository, InventoryRepository);
    const result = await useCase.execute({
      dispatchId: req.params.dispatchId,
      receivedBy: req.user?.userId || req.user?.id || req.body.receivedBy,
      items: req.body.items || [],
      notes: req.body.notes,
    });
    respond(res, result);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(res, error.message || 'Failed to receive dispatch', 400);
  }
};

export const cancelStoreDispatch = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const useCase = new CancelStoreDispatchUseCase(storeDispatchRepository);
    const result = await useCase.execute(req.params.dispatchId, req.body.reason);
    respond(res, result);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(res, error.message || 'Failed to cancel dispatch', 400);
  }
};
