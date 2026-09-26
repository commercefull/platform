jest.mock('./logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import type { HttpRequest, HttpResponse } from './http';
import { createOriginVerifyMiddleware, isRateLimitEnabled, resolveTrustProxy, safeEqual } from './httpSecurity';

const buildRes = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as HttpResponse & { status: jest.Mock; json: jest.Mock };
};

const buildReq = (path: string, headers: Record<string, string> = {}) => ({ path, headers, ip: '1.2.3.4' }) as unknown as HttpRequest;

describe('safeEqual', () => {
  it('should return true when strings are identical', () => {
    expect(safeEqual('secret-value', 'secret-value')).toBe(true);
  });

  it('should return false when strings differ or have different lengths', () => {
    expect(safeEqual('secret-value', 'secret-valuX')).toBe(false);
    expect(safeEqual('secret', 'secret-value')).toBe(false);
  });
});

describe('resolveTrustProxy', () => {
  it('should default to one hop in production when unset', () => {
    expect(resolveTrustProxy(undefined, true)).toBe(1);
  });

  it('should default to disabled outside production when unset', () => {
    expect(resolveTrustProxy(undefined, false)).toBe(false);
  });

  it('should return the configured hop count', () => {
    expect(resolveTrustProxy('2', true)).toBe(2);
    expect(resolveTrustProxy('0', true)).toBe(false);
  });

  it('should throw when the value is not a bounded integer', () => {
    expect(() => resolveTrustProxy('true', true)).toThrow('TRUST_PROXY');
    expect(() => resolveTrustProxy('-1', true)).toThrow('TRUST_PROXY');
    expect(() => resolveTrustProxy('99', true)).toThrow('TRUST_PROXY');
  });
});

describe('isRateLimitEnabled', () => {
  it('should be enabled when NODE_ENV is production or staging', () => {
    expect(isRateLimitEnabled({ NODE_ENV: 'production' })).toBe(true);
    expect(isRateLimitEnabled({ NODE_ENV: 'staging' })).toBe(true);
  });

  it('should be disabled when NODE_ENV is development or test', () => {
    expect(isRateLimitEnabled({ NODE_ENV: 'development' })).toBe(false);
    expect(isRateLimitEnabled({ NODE_ENV: 'test' })).toBe(false);
  });

  it('should honour explicit overrides', () => {
    expect(isRateLimitEnabled({ NODE_ENV: 'development', RATE_LIMIT_ENABLED: '1' })).toBe(true);
    expect(isRateLimitEnabled({ NODE_ENV: 'production', RATE_LIMIT_DISABLED: '1' })).toBe(false);
  });
});

describe('createOriginVerifyMiddleware', () => {
  it('should pass through when no secret is configured', () => {
    const next = jest.fn();
    createOriginVerifyMiddleware(undefined, 'x-origin-verify')(buildReq('/'), buildRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should pass through when the header matches the secret', () => {
    const next = jest.fn();
    createOriginVerifyMiddleware('edge-secret', 'x-origin-verify')(buildReq('/', { 'x-origin-verify': 'edge-secret' }), buildRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should reject with 403 when the header is missing or wrong', () => {
    const next = jest.fn();
    const res = buildRes();
    createOriginVerifyMiddleware('edge-secret', 'x-origin-verify')(buildReq('/admin', { 'x-origin-verify': 'nope' }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should allow the health check without the header', () => {
    const next = jest.fn();
    createOriginVerifyMiddleware('edge-secret', 'x-origin-verify')(buildReq('/health'), buildRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
