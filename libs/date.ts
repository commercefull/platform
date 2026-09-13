/**
 * Date Utilities
 *
 * Shared date/time helpers used across modules.
 * Part of the shared kernel (`libs/`) — no dependencies on `modules/*`.
 */

/**
 * Returns the current Unix timestamp in seconds.
 * Used by repository layers for DB timestamp columns.
 */
export function unixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}
