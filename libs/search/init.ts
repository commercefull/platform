/**
 * Search adapter initialization
 *
 * Reads SEARCH_BACKEND env var and configures the appropriate adapter.
 * Called once at boot.
 */

import { logger } from '../logger';
import { setSearchAdapter } from './types';
import { PostgresFtsAdapter } from './postgresFtsAdapter';

export function initSearchAdapter(): void {
  const backend = process.env.SEARCH_BACKEND || 'postgres';

  switch (backend) {
    case 'postgres':
    case 'postgres-fts':
      setSearchAdapter(new PostgresFtsAdapter());
      logger.info('Search backend initialized', { backend: 'postgres-fts' });
      break;

    case 'opensearch':
      logger.warn('Search backend "opensearch" not yet implemented, falling back to postgres-fts');
      setSearchAdapter(new PostgresFtsAdapter());
      break;

    case 'pgvector':
      logger.warn('Search backend "pgvector" not yet implemented, falling back to postgres-fts');
      setSearchAdapter(new PostgresFtsAdapter());
      break;

    default:
      logger.warn('Unknown SEARCH_BACKEND, falling back to postgres-fts', { backend });
      setSearchAdapter(new PostgresFtsAdapter());
  }
}

