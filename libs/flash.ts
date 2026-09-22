/** Minimal structural type — satisfied by both HttpRequest and raw express Request. */
interface FlashCapableRequest {
  session?: unknown;
  flash?: (type: string) => string[];
}

/**
 * Pop flash messages without dirtying the session.
 *
 * connect-flash lazily writes `session.flash` on every `req.flash()` call,
 * so calling it unconditionally creates a session row + cookie for every
 * anonymous page view. Guard on existing flash content first.
 */
export function popFlashMessages(req: FlashCapableRequest): { successMsg: string | null; errorMsg: string | null } {
  const hasFlash = Boolean((req.session as unknown as { flash?: Record<string, string[]> } | undefined)?.flash);
  return {
    successMsg: hasFlash && req.flash ? req.flash('success')[0] || null : null,
    errorMsg: hasFlash && req.flash ? req.flash('error')[0] || null : null,
  };
}
