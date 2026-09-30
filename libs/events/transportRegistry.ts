/**
 * Event Transport Registry
 *
 * Leaf module holding the active EventTransport. Intentionally has no
 * runtime imports so it can be referenced by both eventBus (publish side)
 * and providers/ (setup side) without creating import cycles.
 *
 * Defaults to in-memory dispatch so emit() works before initEventTransport()
 * runs (unit tests, scripts) — identical to the historical behavior.
 */

import type { EventPayload } from './eventTypes';
import type { EventPublisher, EventTransport } from './eventTransport';

type DispatchFn = (payload: EventPayload) => Promise<void>;

let dispatchFn: DispatchFn | null = null;
let transport: EventTransport | null = null;

/** Called by eventBus at construction — the default in-memory publisher. */
export function setEventDispatch(fn: DispatchFn): void {
  dispatchFn = fn;
}

/** Returns the active publisher, or a memory fallback dispatching in-process. */
export function getEventPublisher(): EventPublisher {
  return (
    transport?.publisher ?? {
      async publish(payload: EventPayload) {
        if (dispatchFn) await dispatchFn(payload).catch(() => {});
      },
    }
  );
}

/** Install the transport built by providers/index at application boot. */
export function setEventTransport(t: EventTransport): void {
  transport = t;
}

/** Start the active subscriber (no-op for providers without one, e.g. memory). */
export async function startEventSubscriber(): Promise<void> {
  if (transport?.subscriber && dispatchFn) {
    await transport.subscriber.start(dispatchFn);
  }
}

/** Stop the subscriber and release publisher resources. */
export async function stopEventTransport(): Promise<void> {
  await transport?.subscriber?.stop();
  await transport?.publisher.close?.();
}
