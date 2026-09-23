import { lazyMock, createOrderFulfillmentPackage } from '../../tests/testUtils';
import { GetFulfillmentPackagesUseCase } from './GetFulfillmentPackages';
import type { OrderFulfillmentPackageRepository } from '../../domain/repositories/OrderFulfillmentPackageRepository';

describe('GetFulfillmentPackagesUseCase', () => {
  let useCase: GetFulfillmentPackagesUseCase;
  let repo: jest.Mocked<OrderFulfillmentPackageRepository>;

  beforeEach(() => {
    repo = lazyMock<OrderFulfillmentPackageRepository>();
    useCase = new GetFulfillmentPackagesUseCase(repo);
  });

  it('should find packages by order', async () => {
    repo.findByOrder.mockResolvedValue([createOrderFulfillmentPackage({ packageNumber: 'PKG-1' })]);

    const result = await useCase.findByOrder('o1');

    expect(result).toHaveLength(1);
    expect(repo.findByOrder).toHaveBeenCalledWith('o1');
  });
});
