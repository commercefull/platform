import { createSessionBackend, resolveSessionBackendType } from './index';
import { PostgresSessionBackend } from './postgresSessionBackend';

describe('libs/session createSessionBackend', () => {
  const env = process.env;
  beforeEach(() => {
    process.env = { ...env };
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
    delete process.env.SESSION_BACKEND;
  });
  afterEach(() => {
    process.env = env;
  });

  it('defaults to postgres when SESSION_BACKEND is unset', () => {
    const backend = createSessionBackend();
    expect(backend.kind).toBe('postgres');
    expect(backend).toBeInstanceOf(PostgresSessionBackend);
  });

  it('throws for SESSION_BACKEND=redis when Redis is unconfigured', () => {
    process.env.SESSION_BACKEND = 'redis';
    expect(() => createSessionBackend()).toThrow('REDIS_URL');
  });

  it('throws for an invalid SESSION_BACKEND value', () => {
    process.env.SESSION_BACKEND = 'auto';
    expect(() => resolveSessionBackendType()).toThrow('Invalid SESSION_BACKEND');
  });

  it('honours explicit postgres selection', () => {
    expect(createSessionBackend('postgres').kind).toBe('postgres');
  });

  it('throws for explicit redis when Redis is unconfigured', () => {
    expect(() => createSessionBackend('redis')).toThrow('REDIS_URL');
  });
});
