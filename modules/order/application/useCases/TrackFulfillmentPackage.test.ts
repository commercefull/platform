import { lazyMock, createOrderFulfillmentPackage } from '../../tests/testUtils';
import { TrackFulfillmentPackageUseCase, TrackFulfillmentPackageCommand } from './TrackFulfillmentPackage';
import type { OrderFulfillmentPackageRepository } from '../../domain/repositories/OrderFulfillmentPackageRepository';
import { FulfillmentPackageNotFoundError } from '../../domain/errors/OrderErrors';

describe('TrackFulfillmentPackageUseCase', () => {
  let useCase: TrackFulfillmentPackageUseCase;
  let repo: jest.Mocked<OrderFulfillmentPackageRepository>;

  beforeEach(() => {
    repo = lazyMock<OrderFulfillmentPackageRepository>();
    useCase = new TrackFulfillmentPackageUseCase(repo);
  });

  it('should create a new package', async () => {
    repo.createPackage.mockResolvedValue(createOrderFulfillmentPackage({ orderFulfillmentPackageId: 'pk1', trackingNumber: 'TRK123' }));

    const result = await useCase.execute(new TrackFulfillmentPackageCommand('f1', 'PKG-001', 'TRK123'));

    expect(result.orderFulfillmentPackageId).toBe('pk1');
    expect(result.trackingNumber).toBe('TRK123');
    expect(repo.createPackage).toHaveBeenCalledWith(expect.objectContaining({ orderFulfillmentId: 'f1', trackingNumber: 'TRK123' }));
  });

  it('should update tracking on an existing package when ID provided', async () => {
    repo.updateTracking.mockResolvedValue(createOrderFulfillmentPackage({ orderFulfillmentPackageId: 'pk1', trackingNumber: 'TRK456' }));

    const result = await useCase.execute(
      new TrackFulfillmentPackageCommand('f1', 'PKG-001', 'TRK456', undefined, undefined, undefined, undefined, undefined, undefined, 'pk1'),
    );

    expect(result.orderFulfillmentPackageId).toBe('pk1');
    expect(result.trackingNumber).toBe('TRK456');
    expect(repo.updateTracking).toHaveBeenCalledWith('pk1', expect.objectContaining({ trackingNumber: 'TRK456' }));
  });

  it('should throw FulfillmentPackageNotFoundError when the package to update does not exist', async () => {
    repo.updateTracking.mockResolvedValue(null as never);

    await expect(
      useCase.execute(
        new TrackFulfillmentPackageCommand('f1', 'PKG-001', 'TRK456', undefined, undefined, undefined, undefined, undefined, undefined, 'missing'),
      ),
    ).rejects.toThrow(FulfillmentPackageNotFoundError);
  });
});
