/**
 * Shared test utilities for pricing unit tests.
 *
 * Pricing ports return plain data shapes rather than domain entities, so the
 * factories below return typed mocks of each use case's local port interface
 * (extracted via ConstructorParameters — the interfaces are not exported).
 * All monetary amounts are integer cents.
 */

import type { CalculatePriceUseCase } from '../application/useCases/CalculatePrice';
import type { CreatePriceListUseCase } from '../application/useCases/CreatePriceList';
import type { SetProductPriceUseCase } from '../application/useCases/SetProductPrice';

type PricingRepositoryPort = ConstructorParameters<typeof CalculatePriceUseCase>[0];
type PriceListRepositoryPort = ConstructorParameters<typeof CreatePriceListUseCase>[0];
type SetPriceRepositoryPort = ConstructorParameters<typeof SetProductPriceUseCase>[0];

export function createPricingRepository(priceCents = 10000): jest.Mocked<PricingRepositoryPort> {
  const repository: jest.Mocked<PricingRepositoryPort> = {
    getBasePrice: jest.fn(),
    getPriceListItem: jest.fn(),
    getTierPrice: jest.fn(),
  };
  repository.getBasePrice.mockResolvedValue({ priceCents, currencyCode: 'USD' });
  repository.getPriceListItem.mockResolvedValue(null);
  repository.getTierPrice.mockResolvedValue(null);
  return repository;
}

export function createPriceListRepository(): jest.Mocked<PriceListRepositoryPort> {
  const repository: jest.Mocked<PriceListRepositoryPort> = {
    createPriceList: jest.fn(),
  };
  repository.createPriceList.mockImplementation(data =>
    Promise.resolve({
      priceListId: data.priceListId,
      name: data.name,
      type: data.type,
      currencyCode: data.currencyCode,
      isDefault: data.isDefault,
      createdAt: new Date(),
    }),
  );
  return repository;
}

export function createSetPriceRepository(): jest.Mocked<SetPriceRepositoryPort> {
  const repository: jest.Mocked<SetPriceRepositoryPort> = {
    setPrice: jest.fn(),
  };
  repository.setPrice.mockImplementation(data =>
    Promise.resolve({
      productId: data.productId,
      variantId: data.variantId,
      priceCents: data.priceCents,
      salePriceCents: data.salePriceCents,
      updatedAt: new Date(),
    }),
  );
  return repository;
}
