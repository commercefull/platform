import type { HttpResponse } from './http';
import {
  cookieResponse,
  errorResponse,
  jsonResponse,
  redirectResponse,
  renderResponse,
  sendResponse,
  setHeader,
  setStatus,
  successResponse,
  validationErrorResponse,
} from './apiResponse';

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn(),
    render: jest.fn(),
    setHeader: jest.fn(),
    cookie: jest.fn(),
  };
  return res as unknown as HttpResponse & typeof res;
}

describe('libs/apiResponse', () => {
  it('jsonResponse sets status and sends json', () => {
    const res = mockRes();
    jsonResponse(res, 201, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('sendResponse sets status and sends a raw body', () => {
    const res = mockRes();
    sendResponse(res, 200, 'plain text');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('plain text');
  });

  it('redirectResponse defaults to 302', () => {
    const res = mockRes();
    redirectResponse(res, '/login');
    expect(res.redirect).toHaveBeenCalledWith(302, '/login');
  });

  it('redirectResponse honours a custom status', () => {
    const res = mockRes();
    redirectResponse(res, '/moved', 301);
    expect(res.redirect).toHaveBeenCalledWith(301, '/moved');
  });

  it('renderResponse renders a view and defaults data to {}', () => {
    const res = mockRes();
    renderResponse(res, 'preview');
    expect(res.render).toHaveBeenCalledWith('preview', {});
  });

  it('setStatus sets the code without sending', () => {
    const res = mockRes();
    setStatus(res, 204);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('setHeader sets a header', () => {
    const res = mockRes();
    setHeader(res, 'X-Test', 'yes');
    expect(res.setHeader).toHaveBeenCalledWith('X-Test', 'yes');
  });

  it('cookieResponse passes options when provided', () => {
    const res = mockRes();
    cookieResponse(res, 'k', 'v', { httpOnly: true });
    expect(res.cookie).toHaveBeenCalledWith('k', 'v', { httpOnly: true });
  });

  it('cookieResponse omits options when not provided', () => {
    const res = mockRes();
    cookieResponse(res, 'k', 'v');
    expect(res.cookie).toHaveBeenCalledWith('k', 'v');
  });

  it('successResponse wraps data in the success envelope', () => {
    const res = mockRes();
    successResponse(res, { id: 5 }, 201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 5 } });
  });

  it('errorResponse wraps the legacy error shape', () => {
    const res = mockRes();
    errorResponse(res, 'oops', 422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'oops', statusCode: 422 },
    });
  });

  it('validationErrorResponse returns 400 with the errors list', () => {
    const res = mockRes();
    validationErrorResponse(res, ['name required']);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Validation failed', statusCode: 400, errors: ['name required'] },
    });
  });
});
