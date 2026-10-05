import { queryOneMock } from '../tests/testUtils';
import { eventBus } from '../../../libs/events/eventBus';
import { analyticsWriteBuffer } from '../infrastructure';
import { initializeAnalyticsHandlers } from './analyticsEventHandler';

jest.mock('../infrastructure', () => ({
  analyticsWriteBuffer: {
    trackEvent: jest.fn().mockResolvedValue(undefined),
    upsertSalesDaily: jest.fn().mockResolvedValue(undefined),
    upsertProductPerformance: jest.fn().mockResolvedValue(undefined),
    flush: jest.fn(),
  },
}));

const trackEventMock = jest.mocked(analyticsWriteBuffer.trackEvent);
const upsertSalesDailyMock = jest.mocked(analyticsWriteBuffer.upsertSalesDaily);
const upsertProductPerformanceMock = jest.mocked(analyticsWriteBuffer.upsertProductPerformance);

type Handler = (payload: unknown) => Promise<void>;
const handlers = new Map<string, Handler>();

beforeAll(() => {
  (eventBus as unknown as { registerHandler: jest.Mock }).registerHandler = jest.fn((type: string, h: Handler) => {
    handlers.set(type, h);
  });
  initializeAnalyticsHandlers();
});

beforeEach(() => {
  trackEventMock.mockClear();
  upsertSalesDailyMock.mockClear();
  upsertProductPerformanceMock.mockClear();
});

describe('analyticsEventHandler sales-channel attribution', () => {
  it('should attribute order rollups to the sales channel when order.created carries channelId', async () => {
    queryOneMock.mockResolvedValueOnce({ organizationId: 'org-1' });

    await handlers.get('order.created')!({
      data: {
        orderId: 'o1',
        customerId: 'c1',
        storeId: 'store-1',
        channelId: 'channel-pos-1',
        totalAmountCents: 10000,
        itemCount: 2,
        currency: 'USD',
        items: [{ productId: 'p1', productVariantId: 'v1', quantity: 2, unitPriceCents: 5000, lineTotalCents: 10000 }],
      },
    });

    expect(trackEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'order.created', salesChannelId: 'channel-pos-1', organizationId: 'org-1' }),
    );
    expect(upsertSalesDailyMock).toHaveBeenCalledWith(
      expect.objectContaining({ salesChannelId: 'channel-pos-1', organizationId: 'org-1', orderCount: 1 }),
    );
    expect(upsertProductPerformanceMock).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1', salesChannelId: 'channel-pos-1', purchases: 1 }),
    );
  });

  it('should resolve organizationId from the store when the order event omits it', async () => {
    queryOneMock.mockResolvedValueOnce({ organizationId: 'org-from-store' });

    await handlers.get('order.created')!({ data: { orderId: 'o2', storeId: 'store-9', channelId: 'ch-9' } });

    expect(queryOneMock).toHaveBeenCalledWith(expect.stringContaining('FROM "store"'), ['store-9']);
    expect(upsertSalesDailyMock).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-from-store' }));
  });

  it('should not query the store table when the event already carries organizationId', async () => {
    await handlers.get('order.created')!({
      data: { orderId: 'o3', organizationId: 'org-explicit', channelId: 'ch-1' },
    });

    expect(queryOneMock).not.toHaveBeenCalled();
    expect(upsertSalesDailyMock).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'org-explicit' }));
  });

  it('should leave salesChannelId undefined when events carry no channelId', async () => {
    queryOneMock.mockResolvedValueOnce(null);

    await handlers.get('order.created')!({ data: { orderId: 'o4' } });

    expect(upsertSalesDailyMock).toHaveBeenCalledWith(expect.objectContaining({ salesChannelId: undefined }));
  });

  it('should attribute checkout funnel events to the sales channel', async () => {
    await handlers.get('checkout.started')!({
      data: { basketId: 'b1', customerId: 'c1', channelId: 'channel-web-1', totalCents: 5000 },
    });

    expect(trackEventMock).toHaveBeenCalledWith(expect.objectContaining({ salesChannelId: 'channel-web-1' }));
    expect(upsertSalesDailyMock).toHaveBeenCalledWith(expect.objectContaining({ salesChannelId: 'channel-web-1', checkoutStarted: 1 }));
  });

  it('should attribute basket item events to the sales channel', async () => {
    await handlers.get('basket.item_added')!({
      data: { basketId: 'b1', productId: 'p1', productVariantId: 'v1', channelId: 'channel-web-1', quantity: 1 },
    });

    expect(trackEventMock).toHaveBeenCalledWith(expect.objectContaining({ salesChannelId: 'channel-web-1' }));
    expect(upsertProductPerformanceMock).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p1', salesChannelId: 'channel-web-1', addToCarts: 1 }),
    );
  });
});
