/**
 * GenerateProductFeed unit tests
 */

import '../../tests/testUtils';
import { GenerateProductFeedUseCase, GenerateProductFeedCommand } from './GenerateProductFeed';
import { makeCatalogPort, createChannelContext, createChannelProduct, STORE_ID } from '../../tests/testUtils';

const SALES_CHANNEL_ID = '99999999-9999-9999-9999-999999999999';

describe('GenerateProductFeedUseCase', () => {
  it('should serialize the channel store catalog into feed items', async () => {
    const catalog = makeCatalogPort();
    catalog.resolveStoreCatalog.mockResolvedValue([
      createChannelProduct({ productId: 'p-1', name: 'Sneaker', slug: 'sneaker' }),
      createChannelProduct({ productId: 'p-2', productVariantId: 'v-2', name: 'Shirt M', slug: 'shirt-m', isAvailable: false }),
    ]);
    const useCase = new GenerateProductFeedUseCase(catalog);

    const feed = await useCase.execute(new GenerateProductFeedCommand(createChannelContext(), 'https://shop.example.com'));

    expect(catalog.resolveStoreCatalog).toHaveBeenCalledWith(STORE_ID, undefined);
    expect(feed.items).toHaveLength(2);
    expect(feed.items[0]).toMatchObject({
      id: 'p-1',
      title: 'Sneaker',
      link: 'https://shop.example.com/products/sneaker',
      availability: 'in_stock',
      price: '19.99 USD',
    });
    expect(feed.items[1]).toMatchObject({ id: 'v-2', item_group_id: 'p-2', availability: 'out_of_stock' });
  });

  it('should pass the channel salesChannelId to catalog resolution when the surface is channel-scoped', async () => {
    const catalog = makeCatalogPort();
    catalog.resolveStoreCatalog.mockResolvedValue([createChannelProduct()]);
    const useCase = new GenerateProductFeedUseCase(catalog);

    await useCase.execute(
      new GenerateProductFeedCommand(createChannelContext({ salesChannelId: SALES_CHANNEL_ID }), 'https://shop.example.com'),
    );

    expect(catalog.resolveStoreCatalog).toHaveBeenCalledWith(STORE_ID, SALES_CHANNEL_ID);
  });
});
