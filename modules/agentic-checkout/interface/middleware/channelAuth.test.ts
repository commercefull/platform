/**
 * Tests for channelAuth middleware — Bearer resolution + HMAC signature
 * verification + raw-body parsing for /acp requests.
 */

import '../../tests/testUtils';
import type { HttpRequest, HttpResponse } from '../../../../libs/http';
import type { ChannelResolverPort } from '../../application/ports/ChannelResolverPort';
import { ChannelAuthenticationError, ChannelSignatureError } from '../../domain/errors/AgenticCheckoutErrors';
import { createChannelAuthMiddleware } from './channelAuth';
import { createChannelContext, INTEGRATION_ID } from '../../tests/testUtils';

function makeResolver(): jest.Mocked<ChannelResolverPort> {
  return {
    resolveByApiKey: jest.fn(async (_apiKey: string) => createChannelContext()),
    verifySignature: jest.fn(
      async (_params: { integrationId: string; signature: string | undefined; timestamp: string | undefined; rawBody: Buffer }) => true,
    ),
  };
}

function makeReq(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    headers: { authorization: 'Bearer acp-test-key-12345' },
    body: Buffer.from(JSON.stringify({ items: [] })),
    ...overrides,
  } as unknown as HttpRequest;
}

describe('channelAuth', () => {
  const resolver = makeResolver();
  const middleware = createChannelAuthMiddleware(resolver);
  const res = {} as HttpResponse;
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    resolver.resolveByApiKey.mockResolvedValue(createChannelContext());
    resolver.verifySignature.mockResolvedValue(true);
  });

  it('should fail with ChannelAuthenticationError when the Authorization header is missing', async () => {
    const req = makeReq({ headers: {} } as HttpRequest);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ChannelAuthenticationError));
  });

  it('should fail with ChannelAuthenticationError when the Authorization header is malformed', async () => {
    const req = makeReq({ headers: { authorization: 'Basic abc' } } as HttpRequest);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ChannelAuthenticationError));
  });

  it('should fail with ChannelAuthenticationError when the bearer key is unknown', async () => {
    resolver.resolveByApiKey.mockResolvedValueOnce(null);

    await middleware(makeReq(), res, next);

    expect(resolver.resolveByApiKey).toHaveBeenCalledWith('acp-test-key-12345');
    expect(next).toHaveBeenCalledWith(expect.any(ChannelAuthenticationError));
  });

  it('should attach the channel context and call next when the key resolves', async () => {
    const req = makeReq();

    await middleware(req, res, next);

    expect(req.channelContext?.integrationId).toBe(INTEGRATION_ID);
    expect(next).toHaveBeenCalledWith();
  });

  it('should verify the signature against the raw body', async () => {
    const raw = JSON.stringify({ items: [{ id: 'p1', quantity: 1 }] });
    const req = makeReq({
      headers: {
        authorization: 'Bearer acp-test-key-12345',
        signature: 'v1,abc123',
        timestamp: '1730000000',
      },
      body: Buffer.from(raw),
    } as unknown as Partial<HttpRequest>);

    await middleware(req, res, next);

    expect(resolver.verifySignature).toHaveBeenCalledWith({
      integrationId: INTEGRATION_ID,
      signature: 'v1,abc123',
      timestamp: '1730000000',
      rawBody: Buffer.from(raw),
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('should fail with ChannelSignatureError when signature verification fails', async () => {
    resolver.verifySignature.mockResolvedValueOnce(false);

    await middleware(makeReq(), res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ChannelSignatureError));
  });

  it('should parse the raw JSON body after signature verification', async () => {
    const payload = { items: [{ id: 'p1', quantity: 2 }] };
    const req = makeReq({ body: Buffer.from(JSON.stringify(payload)) } as HttpRequest);

    await middleware(req, res, next);

    expect(req.body).toEqual(payload);
    expect(next).toHaveBeenCalledWith();
  });

  it('should fail with ChannelAuthenticationError when the raw body is not valid JSON', async () => {
    const req = makeReq({ body: Buffer.from('not-json{') } as HttpRequest);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ChannelAuthenticationError));
  });
});
