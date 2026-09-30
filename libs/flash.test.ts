import { flashMiddleware, popFlashMessages } from './flash';
import type { HttpRequest, HttpResponse } from './http';

interface FlashSessionRequest extends HttpRequest {
  session: HttpRequest['session'] & { flash?: Record<string, string[]> };
}

const run = (session?: { flash?: Record<string, string[]> }) => {
  const req = { session } as unknown as FlashSessionRequest;
  flashMiddleware()(req, {} as HttpResponse, () => undefined);
  return req;
};

describe('flashMiddleware', () => {
  it('stores and pops messages by type', () => {
    const req = run({});
    req.flash('success', 'Saved');
    req.flash('success', 'Saved again');
    expect(req.flash('success')).toEqual(['Saved', 'Saved again']);
    expect(req.flash('success')).toEqual([]);
  });

  it('accepts message arrays', () => {
    const req = run({});
    req.flash('error', ['a', 'b']);
    expect(req.flash('error')).toEqual(['a', 'b']);
  });

  it('returns and clears the whole bucket when called without arguments', () => {
    const req = run({});
    req.flash('success', 's');
    req.flash('error', 'e');
    expect(req.flash()).toEqual({ success: ['s'], error: ['e'] });
    expect(req.session.flash).toBeUndefined();
  });

  it('does not dirty the session on empty reads', () => {
    const session: { flash?: Record<string, string[]> } = {};
    const req = run(session);
    expect(req.flash('success')).toEqual([]);
    expect(session.flash).toBeUndefined();
  });

  it('returns empty results when there is no session', () => {
    const req = run(undefined);
    expect(req.flash('error')).toEqual([]);
    expect(req.flash()).toEqual({});
    expect(req.flash('error', 'x')).toEqual([]);
  });
});

describe('popFlashMessages', () => {
  it('pops success and error messages', () => {
    const req = run({ flash: { success: ['ok'], error: ['bad'] } });
    expect(popFlashMessages(req)).toEqual({ successMsg: 'ok', errorMsg: 'bad' });
    expect(req.session.flash).toEqual({});
  });

  it('returns nulls when no flash content exists', () => {
    const req = run({});
    expect(popFlashMessages(req)).toEqual({ successMsg: null, errorMsg: null });
  });
});
