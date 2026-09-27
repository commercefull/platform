/**
 * RecordOrderCoPurchase tests — idempotency ledger, large-order skip,
 * reversal on cancel.
 */

import { lazyMock, ORG_ID } from '../../tests/testUtils';
import { RecordOrderCoPurchaseUseCase } from './RecordOrderCoPurchase';
import type { CoPurchaseRepository, ProcessedOrderRepository } from '../../domain/repositories/CoPurchaseRepository';
import type { OrderLinesPort } from '../ports/OrderLinesPort';
import type { RecommendationConfigPort } from '../ports/RecommendationConfigPort';
import { DEFAULT_RECOMMENDATION_CONFIG } from '../ports/RecommendationConfigPort';

const lines = (productIds: string[]) => productIds.map(productId => ({ orderId: 'o1', productId, organizationId: ORG_ID, storeId: null }));

describe('RecordOrderCoPurchaseUseCase', () => {
  let signals: jest.Mocked<CoPurchaseRepository>;
  let ledger: jest.Mocked<ProcessedOrderRepository>;
  let orderLines: jest.Mocked<OrderLinesPort>;
  let config: jest.Mocked<RecommendationConfigPort>;
  let useCase: RecordOrderCoPurchaseUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    signals = lazyMock<CoPurchaseRepository>();
    ledger = lazyMock<ProcessedOrderRepository>();
    orderLines = lazyMock<OrderLinesPort>();
    config = lazyMock<RecommendationConfigPort>();
    config.getConfig.mockResolvedValue({ ...DEFAULT_RECOMMENDATION_CONFIG });
    ledger.get.mockResolvedValue(null);
    useCase = new RecordOrderCoPurchaseUseCase(signals, ledger, orderLines, config);
  });

  it('should count every ordered pair when an order is paid', async () => {
    orderLines.getLines.mockResolvedValue(lines(['a', 'b', 'c']));
    await useCase.onOrderPaid('o1');

    expect(signals.incrementProductCounts).toHaveBeenCalledWith({ organizationId: ORG_ID, storeId: null }, ['a', 'b', 'c']);
    expect(signals.incrementTotalOrders).toHaveBeenCalled();
    expect(signals.incrementPairs).toHaveBeenCalledWith({ organizationId: ORG_ID, storeId: null }, ['a', 'b', 'c']);
    expect(ledger.insert).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'o1', status: 'counted' }));
  });

  it('should not count pairs for a single-item order when paid', async () => {
    orderLines.getLines.mockResolvedValue(lines(['a']));
    await useCase.onOrderPaid('o1');
    expect(signals.incrementPairs).not.toHaveBeenCalled();
    expect(signals.incrementProductCounts).toHaveBeenCalled();
  });

  it('should skip duplicate order.paid deliveries when the ledger has a record', async () => {
    ledger.get.mockResolvedValue({ orderId: 'o1', organizationId: ORG_ID, storeId: null, productIds: ['a', 'b'], status: 'counted' });
    await useCase.onOrderPaid('o1');
    expect(orderLines.getLines).not.toHaveBeenCalled();
    expect(signals.incrementPairs).not.toHaveBeenCalled();
  });

  it('should mark orders above maxItemsPerOrder as skipped when paid', async () => {
    const many = Array.from({ length: 25 }, (_, i) => `p${i}`);
    orderLines.getLines.mockResolvedValue(lines(many));
    await useCase.onOrderPaid('o1');
    expect(signals.incrementPairs).not.toHaveBeenCalled();
    expect(ledger.insert).toHaveBeenCalledWith(expect.objectContaining({ status: 'skipped' }));
  });

  it('should reverse counts when a counted order is cancelled', async () => {
    ledger.get.mockResolvedValue({ orderId: 'o1', organizationId: ORG_ID, storeId: null, productIds: ['a', 'b'], status: 'counted' });
    await useCase.onOrderReversed('o1');
    expect(signals.incrementProductCounts).toHaveBeenCalledWith({ organizationId: ORG_ID, storeId: null }, ['a', 'b'], -1);
    expect(signals.decrementPairs).toHaveBeenCalledWith({ organizationId: ORG_ID, storeId: null }, ['a', 'b']);
    expect(ledger.markStatus).toHaveBeenCalledWith('o1', 'reversed');
  });

  it('should ignore reversals for orders never counted when cancelled', async () => {
    await useCase.onOrderReversed('unknown');
    expect(signals.decrementPairs).not.toHaveBeenCalled();
    expect(ledger.markStatus).not.toHaveBeenCalled();
  });
});
