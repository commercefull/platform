import type { AxiosResponse } from 'axios';

/**
 * Assert that an HTTP response stays within a per-endpoint SQL query budget.
 *
 * The server's query-count middleware (active in dev/test mode) injects an
 * `X-Query-Count` response header. This helper reads that header and fails
 * the test when the count exceeds the specified budget, printing the actual
 * count for easy debugging.
 *
 * @example
 * const res = await client.get('/customer/products');
 * expectQueryBudget(res, 10, 'GET /customer/products');
 */
export function expectQueryBudget(
  res: AxiosResponse,
  budget: number,
  label: string,
): void {
  const raw = res.headers['x-query-count'];
  const count = raw !== undefined && raw !== null
    ? parseInt(Array.isArray(raw) ? raw[0] : String(raw), 10)
    : NaN;

  if (Number.isNaN(count)) {
    fail(
      `Query budget test for "${label}" could not read X-Query-Count header.\n` +
      'Ensure the server is running in dev/test mode (NODE_ENV !== "production").',
    );
  }

  if (count > budget) {
    fail(
      `Query budget exceeded for "${label}": ${count} queries > budget of ${budget}.\n` +
      'This likely indicates an N+1 query pattern. Check for loops that execute per-item SQL queries.',
    );
  }
}

/**
 * Fetch the X-Query-Count header value from a response. Returns NaN if the
 * header is missing (e.g. production mode or server not instrumented).
 */
export function getQueryCount(
  res: AxiosResponse,
): number {
  const raw = res.headers['x-query-count'];
  if (raw === undefined || raw === null) return NaN;
  return parseInt(Array.isArray(raw) ? raw[0] : String(raw), 10);
}
