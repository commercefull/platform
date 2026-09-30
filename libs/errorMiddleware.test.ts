jest.mock('./logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), warning: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock('./correlationId', () => ({ getCorrelationId: () => 'test-correlation' }));

import { errorMiddleware } from './errorMiddleware';
import { AppError, NotFoundError } from './errors';
import { logger } from './logger';
import type { HttpNext, HttpRequest, HttpResponse } from './http';

function mockReq(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    path: '/business/things',
    method: 'GET',
    headers: { accept: 'application/json' },
    xhr: false,
    ...overrides,
  } as unknown as HttpRequest;
}

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    render: jest.fn(),
    clearCookie: jest.fn(),
    locals: {} as Record<string, unknown>,
  };
  return res as unknown as HttpResponse & typeof res;
}

const next = jest.fn() as unknown as HttpNext;

describe('libs/errorMiddleware', () => {
  beforeEach(() => jest.clearAllMocks());
  const env = process.env;
  afterEach(() => {
    process.env = env;
  });

  it('maps AppError status to the response status for API requests', () => {
    const res = mockRes();
    errorMiddleware(new NotFoundError('nope'), mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/problem+json');
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe(404);
    expect(body.detail).toBe('nope');
    expect(body.code).toBe('not_found');
    expect(body.success).toBe(false);
    expect(body.correlationId).toBe('test-correlation');
  });

  it('hides 5xx message details in production', () => {
    process.env = { ...env, NODE_ENV: 'production' };
    const res = mockRes();
    errorMiddleware(new AppError('db password leaked', 500), mockReq(), res, next);
    const body = res.json.mock.calls[0][0];
    expect(body.detail).toBe('An internal error occurred');
    expect(body.error.message).toBe('An internal error occurred');
  });

  it('keeps 4xx message details in production', () => {
    process.env = { ...env, NODE_ENV: 'production' };
    const res = mockRes();
    errorMiddleware(new NotFoundError('still visible'), mockReq(), res, next);
    expect(res.json.mock.calls[0][0].detail).toBe('still visible');
  });

  it('maps multer file-size errors to 400', () => {
    const res = mockRes();
    const err = Object.assign(new Error('too big'), { code: 'LIMIT_FILE_SIZE' });
    errorMiddleware(err, mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('honours status/statusCode on generic errors', () => {
    const res = mockRes();
    errorMiddleware(Object.assign(new Error('teapot'), { status: 418 }), mockReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(418);
  });

  it('renders the error page for browser (non-API) requests', () => {
    const res = mockRes();
    const req = mockReq({ path: '/admin/orders', headers: { accept: 'text/html' } });
    errorMiddleware(new AppError('kaboom', 500), req, res, next);
    expect(res.render).toHaveBeenCalledWith(
      'storefront/themes/default/error',
      expect.objectContaining({ pageName: 'Error' }),
    );
    expect(res.json).not.toHaveBeenCalled();
  });

  it('logs 5xx at error level and 4xx at info level', () => {
    errorMiddleware(new AppError('bad', 500), mockReq(), mockRes(), next);
    expect(logger.error).toHaveBeenCalled();
    errorMiddleware(new NotFoundError('x'), mockReq(), mockRes(), next);
    expect(logger.info).toHaveBeenCalled();
  });
});
