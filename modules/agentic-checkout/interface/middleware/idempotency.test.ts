/**
 * Tests for the idempotency middleware — ACP Idempotency-Key handling:
 * required on POSTs, replay on matching hash, 422 on conflict, 409 in-flight.
 */

import { createHash } from 'crypto';
import '../../tests/testUtils';
import type { HttpRequest, HttpResponse } from '../../../../libs/http';
import type { IdempotencyRepository } from '../../domain/repositories/IdempotencyRepository';
import { IdempotencyRecord } from '../../domain/entities/IdempotencyRecord';
import {
  ChannelAuthenticationError,
  IdempotencyConflictError,
  IdempotencyInFlightError,
  IdempotencyKeyRequiredError,
} from '../../domain/errors/AgenticCheckoutErrors';
import { createIdempotencyMiddleware } from './idempotency';
import { createChannelContext, INTEGRATION_ID } from '../../tests/testUtils';

function makeRepo(): jest.Mocked<IdempotencyRepository> {
  return {
    createIfAbsent: jest.fn(async (record: IdempotencyRecord) => record),
    findByKey: jest.fn(async (_integrationId: string, _key: string): Promise<IdempotencyRecord | null> => null),
    update: jest.fn(async (record: IdempotencyRecord) => record),
    deleteExpired: jest.fn(async (_now: Date) => 0),
  };
}

const PATH = '/acp/checkout_sessions';

function requestHash(method: string, path: string, body: unknown): string {
  const raw = Buffer.isBuffer(body) ? body.toString('utf8') : JSON.stringify(body ?? {});
  return createHash('sha256').update(`${method} ${path} ${raw}`).digest('hex');
}

function makeReq(overrides: Partial<HttpRequest> = {}): HttpRequest {
  return {
    method: 'POST',
    path: PATH,
    headers: { 'idempotency-key': 'idem-1' },
    body: { items: [{ id: 'p1', quantity: 1 }] },
    channelContext: createChannelContext(),
    ...overrides,
  } as unknown as HttpRequest;
}

function makeRes(): HttpResponse & { json: jest.Mock; setHeader: jest.Mock } {
  const res = {
    statusCode: 200,
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res as unknown as HttpResponse & { json: jest.Mock; setHeader: jest.Mock };
}

function storedRecord(hash: string, overrides: Partial<Parameters<typeof IdempotencyRecord.reconstitute>[0]> = {}) {
  return IdempotencyRecord.reconstitute({
    idempotencyRecordId: 'rec-1',
    integrationId: INTEGRATION_ID,
    key: 'idem-1',
    requestHash: hash,
    method: 'POST',
    path: PATH,
    state: 'completed',
    responseStatus: 201,
    responseBody: { id: 'sess-1' },
    createdAt: new Date(Date.now() - 60_000),
    expiresAt: new Date(Date.now() + 3_600_000),
    ...overrides,
  });
}

describe('idempotency middleware', () => {
  const repo = makeRepo();
  const middleware = createIdempotencyMiddleware(repo);
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    repo.findByKey.mockResolvedValue(null);
    repo.createIfAbsent.mockImplementation(async record => record);
  });

  it('should fail with IdempotencyKeyRequiredError when the key header is missing', async () => {
    const req = makeReq({ headers: {} } as HttpRequest);

    await middleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(IdempotencyKeyRequiredError));
  });

  it('should fail with ChannelAuthenticationError when no channel context is present', async () => {
    const req = makeReq();
    delete req.channelContext;

    await middleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ChannelAuthenticationError));
  });

  it('should claim a new key, set the Idempotency-Key header, and call next', async () => {
    const req = makeReq();
    const res = makeRes();

    await middleware(req, res, next);

    expect(repo.createIfAbsent).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'idem-1', integrationId: INTEGRATION_ID, state: 'in_flight' }),
    );
    expect(res.setHeader).toHaveBeenCalledWith('Idempotency-Key', 'idem-1');
    expect(next).toHaveBeenCalledWith();
  });

  it('should capture the handler response onto the record when res.json is invoked', async () => {
    const req = makeReq();
    const res = makeRes();
    res.statusCode = 201;

    await middleware(req, res, next);
    res.json({ id: 'sess-1' });

    const record = repo.createIfAbsent.mock.calls[0][0];
    expect(record.state).toBe('completed');
    expect(record.responseStatus).toBe(201);
    expect(record.responseBody).toEqual({ id: 'sess-1' });
    expect(repo.update).toHaveBeenCalledWith(record);
  });

  it('should replay the stored response when the key was used with the same payload', async () => {
    const req = makeReq();
    repo.findByKey.mockResolvedValueOnce(storedRecord(requestHash('POST', PATH, req.body)));
    const res = makeRes();

    await middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Idempotent-Replayed', 'true');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'sess-1' });
    expect(next).not.toHaveBeenCalled();
    expect(repo.createIfAbsent).not.toHaveBeenCalled();
  });

  it('should fail with IdempotencyConflictError when the key was used with a different payload', async () => {
    repo.findByKey.mockResolvedValueOnce(storedRecord('different-hash'));

    await middleware(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(IdempotencyConflictError));
  });

  it('should fail with IdempotencyInFlightError when the same request is still processing', async () => {
    const req = makeReq();
    repo.findByKey.mockResolvedValueOnce(storedRecord(requestHash('POST', PATH, req.body), { state: 'in_flight' }));

    await middleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(IdempotencyInFlightError));
  });

  it('should treat an expired record as absent and claim the key again', async () => {
    const req = makeReq();
    repo.findByKey.mockResolvedValueOnce(storedRecord(requestHash('POST', PATH, req.body), { expiresAt: new Date(Date.now() - 1000) }));

    await middleware(req, makeRes(), next);

    expect(repo.createIfAbsent).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('should fail with IdempotencyInFlightError when createIfAbsent loses the race', async () => {
    repo.createIfAbsent.mockResolvedValueOnce(null);

    await middleware(makeReq(), makeRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(IdempotencyInFlightError));
  });
});
