declare module 'connect-pg-simple' {
  import type { Pool } from 'pg';
  import type session from 'express-session';

  interface PgSessionOptions {
    pool?: Pool;
    tableName?: string;
    schemaName?: string;
    pruneSessionInterval?: number;
    createTableIfMissing?: boolean;
    ttl?: number;
    disableTouch?: boolean;
    errorLog?: (...args: unknown[]) => void;
  }

  class PgSessionStore extends session.Store {
    constructor(options?: PgSessionOptions);
    close(): Promise<void>;
    pruneSessions(): Promise<void>;
  }

  function connectPgSimple(s: typeof session): typeof PgSessionStore;
  export = connectPgSimple;
}
