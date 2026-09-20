import { createHttpRouter, httpRaw } from './expressAdapter';

describe('Express HTTP adapter', () => {
  it('creates a router with the supported routing methods', () => {
    const router = createHttpRouter();

    expect(typeof router.get).toBe('function');
    expect(typeof router.post).toBe('function');
    expect(typeof router.put).toBe('function');
    expect(typeof router.patch).toBe('function');
    expect(typeof router.delete).toBe('function');
    expect(typeof router.use).toBe('function');
  });

  it('creates raw body middleware', () => {
    expect(httpRaw({ type: 'application/json' })).toEqual(expect.any(Function));
  });
});
