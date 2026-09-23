import type {
  Express,
  NextFunction,
  Request as ExpressRequest,
  RequestHandler,
  Response as ExpressResponse,
  Router,
} from 'express';

export interface HttpRequest<
  Params = Record<string, string>,
  ResponseBody = unknown,
  RequestBody = unknown,
  Query = Record<string, string>,
  Locals extends Record<string, unknown> = Record<string, unknown>,
> extends ExpressRequest<Params, ResponseBody, RequestBody, Query, Locals> {
  params: Params;
}

export type HttpResponse<Body = unknown, Locals extends Record<string, unknown> = Record<string, unknown>> = ExpressResponse<Body, Locals>;

export type HttpNext = NextFunction;
export type HttpHandler = RequestHandler;
export type HttpRouter = Router;
export type HttpApplication = Express;
export type HttpRequestBody = Record<string, unknown>;
