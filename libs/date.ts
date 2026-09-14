/**
 * Date Utilities
 *
 * Shared date/time helpers used across modules.
 * Part of the shared kernel (`libs/`) — no dependencies on `modules/*`.
 */

/**
 * Returns the current timestamp as an ISO 8601 string.
 * Used by repository layers for DB timestamp columns.
 *
 * PostgreSQL `timestamp`/`timestamptz` columns accept ISO strings directly;
 * raw epoch seconds are rejected with "date/time field value out of range".
 */
export function unixTimestamp(): string {
  return new Date().toISOString();
}
