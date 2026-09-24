/**
 * Session Module
 *
 * Identity user sessions behind a backend port — Postgres table by
 * default, Redis when configured (same convention as libs/cache and the
 * express-session store). `SessionService` keeps the historical facade
 * API so callers don't change.
 */

export { SessionService } from './SessionService';
export { createSessionBackend, resolveSessionBackendType } from './createSessionBackend';
