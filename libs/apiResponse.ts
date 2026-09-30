import type { HttpCookieOptions, HttpResponse } from './http';

/**
 * Response transport helpers — the ONLY place controllers should touch the
 * underlying HTTP response API. These delegate to Express's Response so the
 * wire behavior (and test mocks of `res.status`/`res.json`/etc.) is unchanged;
 * swapping the web framework later means editing this file only.
 */

/** Send a JSON body with a status code. Replaces `res.status(x).json(b)` / `res.json(b)`. */
export function jsonResponse(res: HttpResponse, statusCode: number, body?: unknown): HttpResponse {
  return res.status(statusCode).json(body);
}

/** Send a non-JSON body (text/xml/etc.) with a status code. Replaces `res.status(x).send(b)` / `res.send(b)`. */
export function sendResponse(res: HttpResponse, statusCode: number, body?: unknown): HttpResponse {
  return res.status(statusCode).send(body);
}

/** Redirect to a URL (default 302). Replaces `res.redirect(u)` / `res.redirect(s, u)`. */
export function redirectResponse(res: HttpResponse, url: string, statusCode: number = 302): void {
  res.redirect(statusCode, url);
}

/** Render a view without layout (partials, previews). Page renders go through adminRespond/storefrontRespond. */
export function renderResponse(res: HttpResponse, view: string, data?: Record<string, unknown>): void {
  res.render(view, data ?? {});
}

/** Set the status code without a terminal send. Replaces standalone `res.status(x)`. */
export function setStatus(res: HttpResponse, statusCode: number): HttpResponse {
  return res.status(statusCode);
}

/** Set a response header. Replaces `res.setHeader(n, v)` / `res.set(n, v)`. */
export function setHeader(res: HttpResponse, name: string, value: string | string[]): HttpResponse {
  res.setHeader(name, value);
  return res;
}

/** Set a cookie. Replaces `res.cookie(n, v, opts)`. */
export function cookieResponse(res: HttpResponse, name: string, value: string, options?: HttpCookieOptions): HttpResponse {
  if (options) {
    res.cookie(name, value, options);
  } else {
    res.cookie(name, value);
  }
  return res;
}


/**
 * Standard API response format for success cases
 * @param res Express response object
 * @param data Response data
 * @param statusCode HTTP status code (default: 200)
 */
export function successResponse(res: HttpResponse, data: unknown, statusCode: number = 200): HttpResponse {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Standard API response format for error cases (legacy shape)
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code (default: 500)
 */
export function errorResponse(res: HttpResponse, message: string, statusCode: number = 500): HttpResponse {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
}

/**
 * Standard API response for validation errors
 * @param res Express response object
 * @param errors Validation errors
 */
export function validationErrorResponse(res: HttpResponse, errors: string[]): HttpResponse {
  return res.status(400).json({
    success: false,
    error: {
      message: 'Validation failed',
      statusCode: 400,
      errors,
    },
  });
}
