/**
 * Shared response helpers for order controllers.
 */

import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageSalesChannelsUseCase } from '../../../store/application/useCases/wired';

export function respond(req: HttpRequest, res: HttpResponse, data: unknown, statusCode: number = 200): void {
  jsonResponse(res, statusCode, { success: true, data });
}

export function respondError(req: HttpRequest, res: HttpResponse, message: string, statusCode: number = 500): void {
  jsonResponse(res, statusCode, { success: false, error: message });
}

/**
 * Rejects storeId/channelId values that do not exist, are inactive, do not
 * belong to the caller's organization, or are not assigned to each other.
 * Returns the response error string, or null when valid.
 */
export async function storeChannelError(
  req: HttpRequest,
  storeId: string | undefined,
  channelId: string | undefined,
): Promise<string | null> {
  if (!storeId && !channelId) return null;
  try {
    await manageSalesChannelsUseCase.assertStoreChannelAccess({
      organizationId: req.user?.organizationId,
      storeId,
      channelId,
    });
    return null;
  } catch (err: unknown) {
    return (err as Error).message;
  }
}
