import { jsonResponse } from '../../../../libs/apiResponse';
import { AppError, getErrorStatusCode } from '../../../../libs/errors';
import type { HttpRequest, HttpResponse } from '../../../../libs/http';
import { logger } from '../../../../libs/logger';
import { manageSalesChannelsUseCase } from '../../application/useCases/wired';
import type { SalesChannelStatus, SalesChannelType, StoreSalesChannel } from '../../domain/entities/SalesChannel';

function organizationId(req: HttpRequest): string | undefined {
  return req.user?.organizationId || req.user?.id;
}

function assignmentResponse(assignment: StoreSalesChannel) {
  return {
    ...assignment,
    channel: assignment.channel?.toJSON(),
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}

function handleError(res: HttpResponse, error: unknown): void {
  logger.error('Sales channel request failed', error);
  jsonResponse(res, getErrorStatusCode(error), {
    success: false,
    message: error instanceof Error ? error.message : 'Sales channel request failed',
    ...(error instanceof AppError ? { code: error.code } : {}),
  });
}

export async function listSalesChannels(req: HttpRequest, res: HttpResponse): Promise<void> {
  const ownerId = organizationId(req);
  if (!ownerId) {
    jsonResponse(res, 401, { success: false, message: 'Authentication required' });
    return;
  }
  try {
    const channels = await manageSalesChannelsUseCase.listForOrganization(ownerId);
    jsonResponse(res, 200, { success: true, data: channels.map(channel => channel.toJSON()) });
  } catch (error) {
    handleError(res, error);
  }
}

export async function createSalesChannel(req: HttpRequest, res: HttpResponse): Promise<void> {
  const ownerId = organizationId(req);
  if (!ownerId) {
    jsonResponse(res, 401, { success: false, message: 'Authentication required' });
    return;
  }
  try {
    const body = req.body as {
      code: string;
      name: string;
      type: SalesChannelType;
      status?: SalesChannelStatus;
      config?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    };
    const channel = await manageSalesChannelsUseCase.create({ organizationId: ownerId, ...body });
    jsonResponse(res, 201, { success: true, data: channel.toJSON() });
  } catch (error) {
    handleError(res, error);
  }
}

export async function updateSalesChannel(req: HttpRequest, res: HttpResponse): Promise<void> {
  const ownerId = organizationId(req);
  if (!ownerId) {
    jsonResponse(res, 401, { success: false, message: 'Authentication required' });
    return;
  }
  try {
    const channel = await manageSalesChannelsUseCase.update({
      organizationId: ownerId,
      salesChannelId: req.params.channelId,
      ...(req.body as {
        name?: string;
        type?: SalesChannelType;
        status?: SalesChannelStatus;
        config?: Record<string, unknown>;
        metadata?: Record<string, unknown>;
      }),
    });
    jsonResponse(res, 200, { success: true, data: channel.toJSON() });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteSalesChannel(req: HttpRequest, res: HttpResponse): Promise<void> {
  const ownerId = organizationId(req);
  if (!ownerId) {
    jsonResponse(res, 401, { success: false, message: 'Authentication required' });
    return;
  }
  try {
    await manageSalesChannelsUseCase.remove(ownerId, req.params.channelId);
    jsonResponse(res, 200, { success: true, message: 'Sales channel deleted' });
  } catch (error) {
    handleError(res, error);
  }
}

export async function listStoreSalesChannels(req: HttpRequest, res: HttpResponse): Promise<void> {
  const ownerId = organizationId(req);
  if (!ownerId) {
    jsonResponse(res, 401, { success: false, message: 'Authentication required' });
    return;
  }
  try {
    const assignments = await manageSalesChannelsUseCase.listForStore(ownerId, req.params.storeId);
    jsonResponse(res, 200, { success: true, data: assignments.map(assignmentResponse) });
  } catch (error) {
    handleError(res, error);
  }
}

export async function assignSalesChannel(req: HttpRequest, res: HttpResponse): Promise<void> {
  const ownerId = organizationId(req);
  if (!ownerId) {
    jsonResponse(res, 401, { success: false, message: 'Authentication required' });
    return;
  }
  try {
    const body = req.body as {
      salesChannelId: string;
      isDefault?: boolean;
      isActive?: boolean;
      settings?: Record<string, unknown>;
    };
    const assignment = await manageSalesChannelsUseCase.assignToStore({
      organizationId: ownerId,
      storeId: req.params.storeId,
      ...body,
    });
    jsonResponse(res, 201, { success: true, data: assignmentResponse(assignment) });
  } catch (error) {
    handleError(res, error);
  }
}

export async function unassignSalesChannel(req: HttpRequest, res: HttpResponse): Promise<void> {
  const ownerId = organizationId(req);
  if (!ownerId) {
    jsonResponse(res, 401, { success: false, message: 'Authentication required' });
    return;
  }
  try {
    await manageSalesChannelsUseCase.unassignFromStore(ownerId, req.params.storeId, req.params.channelId);
    jsonResponse(res, 200, { success: true, message: 'Sales channel unassigned' });
  } catch (error) {
    handleError(res, error);
  }
}
