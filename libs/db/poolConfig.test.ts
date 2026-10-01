import { resolvePoolConfig } from './poolConfig';

describe('resolvePoolConfig', () => {
  it('should use bounded production-safe defaults when optional settings are unset', () => {
    expect(resolvePoolConfig({ POSTGRES_PORT: '5432' })).toMatchObject({
      port: 5432,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 2_000,
      statement_timeout: 30_000,
      query_timeout: 35_000,
      application_name: 'commercefull-web',
    });
  });

  it('should resolve explicit pool and timeout settings', () => {
    expect(
      resolvePoolConfig({
        POSTGRES_PORT: '5433',
        POSTGRES_POOL_MAX: '6',
        POSTGRES_IDLE_TIMEOUT_MS: '12000',
        POSTGRES_CONNECTION_TIMEOUT_MS: '1500',
        POSTGRES_STATEMENT_TIMEOUT_MS: '9000',
        POSTGRES_QUERY_TIMEOUT_MS: '10000',
        POSTGRES_APPLICATION_NAME: 'commercefull-worker',
      }),
    ).toMatchObject({
      port: 5433,
      max: 6,
      idleTimeoutMillis: 12_000,
      connectionTimeoutMillis: 1_500,
      statement_timeout: 9_000,
      query_timeout: 10_000,
      application_name: 'commercefull-worker',
    });
  });

  it('should reject invalid numeric settings instead of silently accepting them', () => {
    expect(() => resolvePoolConfig({ POSTGRES_POOL_MAX: '0' })).toThrow('POSTGRES_POOL_MAX');
    expect(() => resolvePoolConfig({ POSTGRES_CONNECTION_TIMEOUT_MS: 'nope' })).toThrow('POSTGRES_CONNECTION_TIMEOUT_MS');
  });
});
