import { hpp } from './hpp';
import type { HttpRequest, HttpResponse } from './http';

const run = (req: Partial<HttpRequest>, whitelist?: string[]) => {
  hpp({ whitelist })(req as HttpRequest, {} as HttpResponse, () => undefined);
  return req;
};

describe('hpp', () => {
  it('collapses repeated query params to the last value', () => {
    const req = run({ query: { a: ['1', '2'] } as unknown as HttpRequest['query'] });
    expect(req.query).toEqual({ a: '2' });
  });

  it('keeps whitelisted params as arrays', () => {
    const req = run({ query: { ids: ['1', '2'], a: ['x', 'y'] } as unknown as HttpRequest['query'] }, ['ids']);
    expect(req.query).toEqual({ ids: ['1', '2'], a: 'y' });
  });

  it('collapses repeated body params', () => {
    const req = run({ query: {}, body: { status: ['open', 'closed'] } });
    expect(req.body).toEqual({ status: 'closed' });
  });

  it('handles missing body and scalar params', () => {
    const req = run({ query: { a: '1' } as HttpRequest['query'] });
    expect(req.query).toEqual({ a: '1' });
  });
});
