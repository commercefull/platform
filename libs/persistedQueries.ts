/**
 * Persisted Query Store
 *
 * In production, optionally restrict GraphQL to only pre-registered query
 * hashes. Queries are registered at build time and looked up by SHA-256 hash.
 *
 * Enable via: GRAPHQL_PERSISTED_QUERIES=true
 * Allowlist file: persistedQueries.json (array of { hash, query } objects)
 */

import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';

interface PersistedQueryEntry {
  hash: string;
  query: string;
}

export class PersistedQueryStore {
  private queryByHash = new Map<string, string>();
  private enabled = false;

  /**
   * Load persisted queries from a JSON file and enable the store.
   */
  loadFromFile(filePath: string): void {
    if (!existsSync(filePath)) {
      logger.warning('Persisted queries file not found, skipping', { filePath });
      return;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const entries: PersistedQueryEntry[] = JSON.parse(content);
      for (const entry of entries) {
        this.queryByHash.set(entry.hash, entry.query);
      }
      this.enabled = true;
      logger.info('Persisted queries loaded', { count: entries.length });
    } catch (err: unknown) {
      logger.error('Failed to load persisted queries', { error: (err as Error).message });
    }
  }

  /**
   * Enable persisted query mode (restrict to allowlist only).
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable persisted query mode (allow all queries).
   */
  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Look up a query by its SHA-256 hash.
   * Returns the query string or null if not found.
   */
  getQuery(hash: string): string | null {
    return this.queryByHash.get(hash) ?? null;
  }

  /**
   * Register a query in the store.
   */
  register(hash: string, query: string): void {
    this.queryByHash.set(hash, query);
  }

  /**
   * Compute the SHA-256 hash of a query string.
   */
  static hashQuery(query: string): string {
    return createHash('sha256').update(query).digest('hex');
  }

  /**
   * Check if a query is allowed (either in the allowlist or persisted queries disabled).
   */
  isQueryAllowed(query: string): boolean {
    if (!this.enabled) return true;
    const hash = PersistedQueryStore.hashQuery(query);
    return this.queryByHash.has(hash);
  }
}

/**
 * Singleton instance.
 * Loaded at boot if GRAPHQL_PERSISTED_QUERIES=true.
 */
export const persistedQueryStore = new PersistedQueryStore();

/**
 * Initialize persisted queries from env config.
 */
export function initPersistedQueries(): void {
  if (process.env.GRAPHQL_PERSISTED_QUERIES === 'true') {
    const filePath = process.env.GRAPHQL_PERSISTED_QUERIES_FILE
      ?? join(process.cwd(), 'persistedQueries.json');
    persistedQueryStore.loadFromFile(filePath);
  }
}
