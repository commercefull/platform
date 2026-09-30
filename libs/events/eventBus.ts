import EventEmitter from 'events';
import { logger } from '../logger';
import { getCorrelationId } from '../correlationId';
import { getEventPublisher, setEventDispatch } from './transportRegistry';

export type { EventType, PlannedEventType, EventPayload, EventHandler } from './eventTypes';
import type { EventType, EventPayload, EventHandler } from './eventTypes';

class EventBus {
  private emitter: EventEmitter;
  private handlers: Map<EventType, EventHandler[]> = new Map();

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
    // Default (memory) publisher: in-process dispatch with error boundaries.
    // initEventTransport() may replace this with a durable/cloud transport.
    setEventDispatch(this.dispatchFromOutbox.bind(this));
  }

  /**
   * Emit an event through the configured transport.
   * With the default memory provider this dispatches to registered handlers
   * in-process; other providers persist/publish for their subscriber to
   * deliver to dispatchFromOutbox().
   */
  async emit(type: EventType, data: unknown, correlationId?: string, source?: string): Promise<void> {
    const payload: EventPayload = {
      type,
      data,
      timestamp: new Date(),
      correlationId: correlationId ?? getCorrelationId(),
      source,
    };

    logger.debug('Event emitted', { type, correlationId, source });
    await getEventPublisher().publish(payload);
  }

  /**
   * Dispatch an event payload from the outbox dispatcher.
   *
   * Unlike emit(), this method does NOT write to the outbox. It directly
   * invokes registered handlers with error boundaries. If any handler
   * throws, the error is re-thrown so the dispatcher can schedule a retry.
   */
  async dispatchFromOutbox(payload: EventPayload): Promise<void> {
    const { type } = payload;

    logger.debug('Dispatching outbox event', { type, correlationId: payload.correlationId });

    // Emit to EventEmitter listeners (wildcard + specific)
    this.emitter.emit(type, payload);
    this.emitter.emit('*', payload);

    // Call registered handlers. Collect errors instead of swallowing.
    const handlers = this.handlers.get(type) || [];
    const errors: Error[] = [];

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err: unknown) {
        logger.error('Outbox event handler error (boundary caught)', {
          type,
          correlationId: payload.correlationId,
          error: (err as Error).message,
          stack: (err as Error).stack,
        });
        errors.push(err as Error);
      }
    }

    // If any handler failed, re-throw so the dispatcher can retry
    if (errors.length > 0) {
      throw new Error(`Outbox dispatch failed for ${type}: ${errors.length} handler(s) failed. First error: ${errors[0].message}`);
    }
  }

  /**
   * Register an event handler
   */
  on(type: EventType | '*', handler: EventHandler): void {
    this.emitter.on(type, handler);
  }

  /**
   * Remove an event handler
   */
  off(type: EventType | '*', handler: EventHandler): void {
    this.emitter.off(type, handler);
  }

  /**
   * Register a typed event handler
   */
  registerHandler(type: EventType, handler: EventHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  /**
   * Unregister a typed event handler
   */
  unregisterHandler(type: EventType, handler: EventHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Get all registered event types
   */
  getRegisteredTypes(): EventType[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Get handler count for an event type
   */
  getHandlerCount(type: EventType): number {
    return this.handlers.get(type)?.length || 0;
  }
}

export const eventBus = new EventBus();
