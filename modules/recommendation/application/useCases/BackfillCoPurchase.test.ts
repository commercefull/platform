/**
 * BackfillCoPurchase tests — paged order scan, per-order recording, rebuild.
 */

import { lazyMock, ORG_ID } from '../../tests/testUtils';
import { BackfillCoPurchaseUseCase, BackfillCoPurchaseCommand } from './BackfillCoPurchase';
import type { OrderLinesPort } from '../ports/OrderLinesPort';
import type { RecordOrderCoPurchaseUseCase } from './RecordOrderCoPurchase';
import type { RebuildRecommendationsUseCase } from './RebuildRecommendations';

describe('BackfillCoPurchaseUseCase', () => {
  let orderLines: jest.Mocked<OrderLinesPort>;
  let recorder: { onOrderPaid: jest.Mock };
  let rebuild: { execute: jest.Mock };
  let useCase: BackfillCoPurchaseUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    orderLines = lazyMock<OrderLinesPort>();
    recorder = { onOrderPaid: jest.fn().mockResolvedValue(undefined) };
    rebuild = { execute: jest.fn().mockResolvedValue({ candidatesWritten: 0 }) };
    useCase = new BackfillCoPurchaseUseCase(
      orderLines,
      recorder as unknown as RecordOrderCoPurchaseUseCase,
      rebuild as unknown as RebuildRecommendationsUseCase,
    );
  });

  it('should page through paid orders and record each one', async () => {
    orderLines.listPaidOrderIdsSince
      .mockResolvedValueOnce({ orderIds: ['o1', 'o2'], nextCursor: 'c1' })
      .mockResolvedValueOnce({ orderIds: ['o3'], nextCursor: null });

    const res = await useCase.execute(new BackfillCoPurchaseCommand(ORG_ID, 180));

    expect(orderLines.listPaidOrderIdsSince).toHaveBeenCalledTimes(2);
    expect(orderLines.listPaidOrderIdsSince).toHaveBeenNthCalledWith(2, expect.any(Date), 'c1', 200);
    expect(recorder.onOrderPaid.mock.calls.map(c => c[0])).toEqual(['o1', 'o2', 'o3']);
    expect(res.processed).toBe(3);
  });

  it('should trigger a rebuild after processing', async () => {
    orderLines.listPaidOrderIdsSince.mockResolvedValue({ orderIds: ['o1'], nextCursor: null });

    await useCase.execute(new BackfillCoPurchaseCommand(ORG_ID, 180));

    expect(rebuild.execute).toHaveBeenCalledWith({ organizationId: ORG_ID });
  });

  it('should handle an empty order range', async () => {
    orderLines.listPaidOrderIdsSince.mockResolvedValue({ orderIds: [], nextCursor: null });

    const res = await useCase.execute(new BackfillCoPurchaseCommand(ORG_ID, 180));

    expect(res.processed).toBe(0);
    expect(recorder.onOrderPaid).not.toHaveBeenCalled();
  });
});
