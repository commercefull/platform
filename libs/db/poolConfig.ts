import type PG from 'pg';

const envInteger = (env: NodeJS.ProcessEnv, name: string, fallback: number, minimum: number, maximum: number): number => {
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum} (got "${raw}")`);
  }
  return value;
};

/**
 * TLS for managed databases (RDS / Cloud SQL / Azure Flexible Server).
 * POSTGRES_SSL=true enables TLS; certificates are verified unless
 * POSTGRES_SSL_REJECT_UNAUTHORIZED=false. POSTGRES_SSL_CA may hold a PEM CA bundle.
 */
const resolveSsl = (env: NodeJS.ProcessEnv): PG.PoolConfig['ssl'] => {
  if (env.POSTGRES_SSL !== 'true') return undefined;
  return {
    rejectUnauthorized: env.POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(env.POSTGRES_SSL_CA ? { ca: env.POSTGRES_SSL_CA } : {}),
  };
};

export const resolvePoolConfig = (env: NodeJS.ProcessEnv = process.env): PG.PoolConfig => ({
  port: envInteger(env, 'POSTGRES_PORT', 5432, 1, 65_535),
  host: env.POSTGRES_HOST,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  ssl: resolveSsl(env),
  max: envInteger(env, 'POSTGRES_POOL_MAX', 10, 1, 100),
  idleTimeoutMillis: envInteger(env, 'POSTGRES_IDLE_TIMEOUT_MS', 30_000, 1_000, 600_000),
  connectionTimeoutMillis: envInteger(env, 'POSTGRES_CONNECTION_TIMEOUT_MS', 2_000, 100, 60_000),
  statement_timeout: envInteger(env, 'POSTGRES_STATEMENT_TIMEOUT_MS', 30_000, 100, 600_000),
  query_timeout: envInteger(env, 'POSTGRES_QUERY_TIMEOUT_MS', 35_000, 100, 600_000),
  application_name: env.POSTGRES_APPLICATION_NAME || 'commercefull-web',
});
