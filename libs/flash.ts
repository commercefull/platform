import type { HttpHandler } from './http';

/** Minimal structural type — satisfied by both HttpRequest and raw express Request. */
interface FlashCapableRequest {
  session?: unknown;
  flash?: (type: string) => string[];
}

interface FlashSession {
  flash?: Record<string, string[]>;
}

/**
 * Session-backed flash middleware — in-house replacement for `connect-flash`.
 *
 * - `req.flash(type, message)` appends `message` (string or string[]) under `type`.
 * - `req.flash(type)` returns and clears all messages under `type`.
 * - `req.flash()` returns and clears the whole flash bucket.
 *
 * Reads are intentionally non-dirtying: calling `req.flash('x')` when no flash
 * content exists does not create `session.flash`, so anonymous page views don't
 * force a session-store write + cookie.
 */
export function flashMiddleware(): HttpHandler {
  return (req, _res, next) => {
    const flash = (type?: string, msg?: string | string[]): string[] | Record<string, string[]> => {
      const session = req.session as FlashSession | undefined;
      if (!session) {
        return type === undefined ? {} : [];
      }
      if (type === undefined) {
        const all = session.flash ?? {};
        delete session.flash;
        return all;
      }
      if (msg === undefined) {
        const messages = session.flash?.[type] ?? [];
        if (session.flash) {
          delete session.flash[type];
        }
        return messages;
      }
      const bucket = session.flash ?? (session.flash = {});
      const messages = Array.isArray(msg) ? msg : [msg];
      bucket[type] = (bucket[type] ?? []).concat(messages);
      return bucket[type];
    };
    req.flash = flash as typeof req.flash;
    next();
  };
}

/**
 * Pop flash messages without dirtying the session.
 *
 * Flash reads lazily touch `session.flash`, so reading unconditionally would
 * create a session row + cookie for every anonymous page view. Guard on
 * existing flash content first.
 */
export function popFlashMessages(req: FlashCapableRequest): { successMsg: string | null; errorMsg: string | null } {
  const hasFlash = Boolean((req.session as FlashSession | undefined)?.flash);
  return {
    successMsg: hasFlash && req.flash ? req.flash('success')[0] || null : null,
    errorMsg: hasFlash && req.flash ? req.flash('error')[0] || null : null,
  };
}
