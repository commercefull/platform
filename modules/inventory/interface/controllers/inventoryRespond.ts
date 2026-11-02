import { jsonResponse } from 'libs/apiResponse';
import type { HttpResponse } from 'libs/http';

export function respond(res: HttpResponse, data: unknown, statusCode: number = 200): void {
  jsonResponse(res, statusCode, { success: true, data });
}

export function respondWithPagination(res: HttpResponse, data: unknown[], limit: number, offset: number): void {
  jsonResponse(res, 200, {
    success: true,
    data,
    pagination: { limit, offset, count: data.length },
  });
}

export function respondError(res: HttpResponse, message: string, statusCode: number = 500): void {
  jsonResponse(res, statusCode, { success: false, error: message });
}
