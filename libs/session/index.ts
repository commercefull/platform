/**
 * Session Module
 *
 * Identity user sessions behind a backend port — Postgres table by
 * default, Redis when configured (same convention as libs/cache and the
 * express-session store). `SessionService` keeps the historical facade
 * API so callers don't change.
 */

export type { SessionData, CreateSessionInput, SessionBackend } from './types';
export { PostgresSessionBackend } from './postgresSessionBackend';
export { RedisSessionBackend } from './redisSessionBackend';
export { SessionService } from './SessionService';
export { createSessionBackend, resolveSessionBackendType } from './createSessionBackend';
export type { SessionBackendType } from './createSessionBackend';
