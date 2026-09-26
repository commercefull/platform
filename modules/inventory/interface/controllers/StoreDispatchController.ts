import type { HttpRequest, HttpResponse } from 'libs/http';

import { DispatchStatus } from '../../domain/entities/StoreDispatch';
import {
  createStoreDispatchUseCase,
  listStoreDispatchesUseCase,
  getStoreDispatchUseCase,
  approveStoreDispatchUseCase,
  dispatchFromStoreUseCase,
  receiveStoreDispatchUseCase,
  cancelStoreDispatchUseCase,
} from '../../application/useCases/wired';

interface CreateDispatchBody {
  fromStoreId: string;
  toStoreId: string;
  items: Array<{ productId: string; variantId?: string; quantity: number; sku?: string; productName?: string; notes?: string }>;
  notes?: string;
  requestedBy?: string;
}

interface ApproveDispatchBody {
  approvedBy?: string;
}

interface DispatchItemsBody {
  dispatchedBy?: string;
  items?: Array<{ dispatchItemId: string; dispatchedQuantity: number }>;
}

interface ReceiveDispatchBody {
  receivedBy?: string;
  items?: Array<{ dispatchItemId: string; receivedQuantity: number }>;
  notes?: string;
}

interface CancelDispatchBody {
  reason?: string;
}

function respond(res: HttpResponse, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(res: HttpResponse, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

export const createStoreDispatch = async (
  req: HttpRequest<Record<string, string>, unknown, CreateDispatchBody>,
  res: HttpResponse,
): Promise<void> => {
  if (!req.body.fromStoreId) {
    respondError(res, 'fromStoreId is required', 400);
    return;
  }
  if (!req.body.toStoreId) {
    respondError(res, 'toStoreId is required', 400);
    return;
  }
  const useCase = createStoreDispatchUseCase;
  const result = await useCase.execute({
    fromStoreId: req.body.fromStoreId,
    toStoreId: req.body.toStoreId,
    items: req.body.items || [],
    notes: req.body.notes,
    requestedBy: req.user?.userId || req.user?.id || req.body.requestedBy || '',
  });

  respond(res, result, 201);
};

export const listStoreDispatches = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = listStoreDispatchesUseCase;
  const result = await useCase.execute({
    fromStoreId: req.query.fromStoreId as string | undefined,
    toStoreId: req.query.toStoreId as string | undefined,
    status: req.query.status as DispatchStatus | undefined,
    dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
    dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
  });

  respond(res, result);
};

export const getStoreDispatch = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const useCase = getStoreDispatchUseCase;
  const result = await useCase.execute(req.params.dispatchId);

  if (!result) {
    respondError(res, 'Dispatch not found', 404);
    return;
  }

  respond(res, result);
};

export const approveStoreDispatch = async (
  req: HttpRequest<Record<string, string>, unknown, ApproveDispatchBody>,
  res: HttpResponse,
): Promise<void> => {
  const useCase = approveStoreDispatchUseCase;
  const actor = req.body.approvedBy || 'test-admin';
  const result = await useCase.execute(req.params.dispatchId, actor);
  respond(res, result);
};

export const dispatchFromStore = async (
  req: HttpRequest<Record<string, string>, unknown, DispatchItemsBody>,
  res: HttpResponse,
): Promise<void> => {
  const useCase = dispatchFromStoreUseCase;
  const actor = req.body.dispatchedBy || 'test-admin';
  const result = await useCase.execute(req.params.dispatchId, actor, req.body.items);
  respond(res, result);
};

export const receiveStoreDispatch = async (
  req: HttpRequest<Record<string, string>, unknown, ReceiveDispatchBody>,
  res: HttpResponse,
): Promise<void> => {
  const useCase = receiveStoreDispatchUseCase;
  const result = await useCase.execute({
    dispatchId: req.params.dispatchId,
    receivedBy: req.body.receivedBy || 'test-admin',
    items: req.body.items || [],
    notes: req.body.notes,
  });
  respond(res, result);
};

export const cancelStoreDispatch = async (
  req: HttpRequest<Record<string, string>, unknown, CancelDispatchBody>,
  res: HttpResponse,
): Promise<void> => {
  const useCase = cancelStoreDispatchUseCase;
  const result = await useCase.execute(req.params.dispatchId, req.body.reason);
  respond(res, result);
};
