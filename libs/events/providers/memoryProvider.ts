/**
 * Memory Event Provider
 *
 * Default provider. Publishes by dispatching to in-process handlers
 * immediately — identical semantics to the historical EventEmitter path:
 * per-handler error boundaries, at-most-once delivery, no subscriber.
 */

import type { EventPayload } from '../eventTypes';
import type { EventTransport } from '../eventTransport';

export function createMemoryTransport(dispatch: (payload: EventPayload) => Promise<void>): EventTransport {
  return {
    publisher: {
      // Dispatch re-throws an aggregate error after logging each handler
      // failure; in-process emit has always been best-effort, so swallow it.
      async publish(payload) {
        await dispatch(payload).catch(() => {});
      },
    },
  };
}
