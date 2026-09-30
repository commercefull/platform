import { createHmac } from 'crypto';
import { cookieParser } from './cookieParser';
import type { HttpRequest, HttpResponse } from './http';

const sign = (value: string, secret: string) => `s:${value}.${createHmac('sha256', secret).update(value).digest('base64url')}`;

const run = (header: string | undefined, secret?: string) => {
  const req = { headers: header === undefined ? {} : { cookie: header } } as unknown as HttpRequest;
  const res = {} as HttpResponse;
  cookieParser(secret)(req, res, () => undefined);
  return req;
};

describe('cookieParser', () => {
  it('parses a simple cookie header', () => {
    const req = run('a=1; b=hello');
    expect(req.cookies).toEqual({ a: '1', b: 'hello' });
    expect(req.signedCookies).toEqual({});
  });

  it('returns empty objects when no Cookie header is present', () => {
    const req = run(undefined);
    expect(req.cookies).toEqual({});
    expect(req.signedCookies).toEqual({});
  });

  it('decodes URI-encoded values', () => {
    const req = run('name=hello%20world');
    expect(req.cookies.name).toBe('hello world');
  });

  it('keeps the first occurrence when a cookie is repeated', () => {
    const req = run('a=1; a=2');
    expect(req.cookies.a).toBe('1');
  });

  it('verifies signed cookies into signedCookies and strips them from cookies', () => {
    const secret = 'test-secret';
    const req = run(`sid=${sign('abc123', secret)}; plain=yes`, secret);
    expect(req.signedCookies.sid).toBe('abc123');
    expect(req.cookies).toEqual({ plain: 'yes' });
    expect(req.cookies.sid).toBeUndefined();
  });

  it('drops signed cookies with a tampered signature', () => {
    const secret = 'test-secret';
    const req = run(`sid=${sign('abc123', 'wrong-secret')}`, secret);
    expect(req.signedCookies.sid).toBeUndefined();
    expect(req.cookies.sid).toBeUndefined();
  });

  it('keeps unsigned s:-prefixed cookies out of signedCookies without a secret', () => {
    const req = run('sid=s:abc.fake');
    expect(req.cookies.sid).toBe('s:abc.fake');
  });
});
