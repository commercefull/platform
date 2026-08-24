jest.mock('../../../../libs/db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../../../libs/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn().mockResolvedValue(undefined) },
}));

import { query, queryOne } from '../../../../libs/db';
import { ReturnRequestRepositoryImpl, ReturnItemRepositoryImpl, StoreCreditRepositoryImpl } from './ReturnRepositoryImpl';
import { ReturnRequest } from '../../domain/entities/ReturnRequest';

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe('ReturnRequestRepositoryImpl', () => {
  let repo: ReturnRequestRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ReturnRequestRepositoryImpl();
  });

  it('findById returns null when not found', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.findById('nonexistent');
    expect(result).toBeNull();
  });

  it('findById returns return request when found', async () => {
    const mockRow = {
      orderReturnId: 'r1', orderId: 'o1', returnNumber: 'RET-001',
      customerId: 'c1', status: 'requested', returnType: 'refund',
      requestedAt: new Date(), approvedAt: null, receivedAt: null, completedAt: null,
      rmaNumber: null, paymentRefundId: null, returnShippingPaid: false,
      returnShippingAmount: null, returnShippingLabel: null, returnCarrier: 'custom',
      returnTrackingNumber: null, returnTrackingUrl: null, returnReason: 'damaged',
      returnInstructions: null, customerNotes: null, adminNotes: null,
      requiresInspection: true, inspectionPassedItems: null, inspectionFailedItems: null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    mockedQueryOne.mockResolvedValueOnce(mockRow as never);
    mockedQuery.mockResolvedValueOnce([] as never);
    const result = await repo.findById('r1');
    expect(result).not.toBeNull();
    expect(result!.orderReturnId).toBe('r1');
    expect(result!.status).toBe('requested');
  });

  it('findByOrderId returns empty when no data', async () => {
    mockedQuery.mockResolvedValueOnce([] as never);
    const result = await repo.findByOrderId('o1');
    expect(result).toEqual([]);
  });

  it('create returns created return request', async () => {
    const ret = ReturnRequest.create({
      orderId: 'o1',
      returnType: 'refund',
      items: [{ orderItemId: 'i1', quantity: 1, returnReason: 'damaged', condition: 'new', restockItem: false }],
    });
    const mockRow = {
      orderReturnId: 'r1', orderId: 'o1', returnNumber: ret.returnNumber,
      customerId: null, status: 'requested', returnType: 'refund',
      requestedAt: new Date(), approvedAt: null, receivedAt: null, completedAt: null,
      rmaNumber: null, paymentRefundId: null, returnShippingPaid: false,
      returnShippingAmount: null, returnShippingLabel: null, returnCarrier: 'custom',
      returnTrackingNumber: null, returnTrackingUrl: null, returnReason: null,
      returnInstructions: null, customerNotes: null, adminNotes: null,
      requiresInspection: true, inspectionPassedItems: null, inspectionFailedItems: null,
      createdAt: new Date(), updatedAt: new Date(),
    };
    mockedQueryOne.mockResolvedValueOnce(mockRow as never);
    mockedQuery.mockResolvedValue([] as never);
    const result = await repo.create(ret);
    expect(result.orderReturnId).toBe('r1');
  });

  it('delete returns true when deleted', async () => {
    mockedQueryOne.mockResolvedValueOnce({ orderReturnId: 'r1' } as never);
    const result = await repo.delete('r1');
    expect(result).toBe(true);
  });

  it('delete returns false when not found', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.delete('nonexistent');
    expect(result).toBe(false);
  });

  it('countByStatus returns 0 when no data', async () => {
    mockedQueryOne.mockResolvedValueOnce({ count: '0' } as never);
    const result = await repo.countByStatus('requested');
    expect(result).toBe(0);
  });

  it('countByStatus returns correct number', async () => {
    mockedQueryOne.mockResolvedValueOnce({ count: '5' } as never);
    const result = await repo.countByStatus('completed');
    expect(result).toBe(5);
  });

  it('getStatistics returns all statuses', async () => {
    mockedQuery.mockResolvedValueOnce([
      { status: 'requested', count: '3' },
      { status: 'completed', count: '7' },
    ] as never);
    const result = await repo.getStatistics();
    expect(result.requested).toBe(3);
    expect(result.completed).toBe(7);
    expect(result.approved).toBe(0);
  });

  it('getStatisticsByType returns all types', async () => {
    mockedQuery.mockResolvedValueOnce([
      { returnType: 'refund', count: '10' },
      { returnType: 'storeCredit', count: '5' },
    ] as never);
    const result = await repo.getStatisticsByType();
    expect(result.refund).toBe(10);
    expect(result.storeCredit).toBe(5);
    expect(result.exchange).toBe(0);
  });
});

describe('ReturnItemRepositoryImpl', () => {
  let repo: ReturnItemRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ReturnItemRepositoryImpl();
  });

  it('findByReturnId returns empty when no data', async () => {
    mockedQuery.mockResolvedValueOnce([] as never);
    const result = await repo.findByReturnId('r1');
    expect(result).toEqual([]);
  });

  it('findById returns null when not found', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.findById('nonexistent');
    expect(result).toBeNull();
  });
});

describe('StoreCreditRepositoryImpl', () => {
  let repo: StoreCreditRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new StoreCreditRepositoryImpl();
  });

  it('getBalance returns zero balance for new customer', async () => {
    mockedQueryOne.mockResolvedValueOnce({
      balance: '0', totalCredits: '0', totalDebits: '0', pendingExpiry: '0', lastEntryAt: null,
    } as never);
    const result = await repo.getBalance('c1');
    expect(result.balance).toBe(0);
    expect(result.totalCredits).toBe(0);
    expect(result.totalDebits).toBe(0);
    expect(result.lastEntryAt).toBeNull();
  });

  it('getBalance returns correct balance', async () => {
    mockedQueryOne.mockResolvedValueOnce({
      balance: '150.50', totalCredits: '200', totalDebits: '49.50', pendingExpiry: '50', lastEntryAt: new Date(),
    } as never);
    const result = await repo.getBalance('c1');
    expect(result.balance).toBe(150.50);
    expect(result.totalCredits).toBe(200);
    expect(result.totalDebits).toBe(49.50);
    expect(result.pendingExpiry).toBe(50);
    expect(result.lastEntryAt).not.toBeNull();
  });

  it('getLedger returns empty when no data', async () => {
    mockedQuery.mockResolvedValueOnce([] as never);
    const result = await repo.getLedger('c1');
    expect(result).toEqual([]);
  });

  it('findByReference returns null when not found', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.findByReference('return', 'r1');
    expect(result).toBeNull();
  });

  it('processExpiry returns 0 when nothing to expire', async () => {
    mockedQueryOne.mockResolvedValueOnce(null);
    const result = await repo.processExpiry();
    expect(result).toBe(0);
  });
});
