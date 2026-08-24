jest.mock('../../infrastructure/repositories/OrderFulfillmentDataRepository', () => ({
  __esModule: true,
  default: {
    fulfillments: {
      findByOrder: jest.fn().mockResolvedValue([{ packageId: 'p1', orderId: 'o1' }]),
      findPackageById: jest.fn().mockResolvedValue({ packageId: 'p1', trackingNumber: 'TRK123' }),
      createPackage: jest.fn().mockResolvedValue({
        orderFulfillmentPackageId: 'pk1', orderFulfillmentId: 'f1', packageNumber: 'PKG-001',
        trackingNumber: 'TRK123', createdAt: new Date(), updatedAt: new Date(),
      }),
      updatePackage: jest.fn().mockResolvedValue({
        orderFulfillmentPackageId: 'pk1', orderFulfillmentId: 'f1', packageNumber: 'PKG-001',
        trackingNumber: 'TRK456', createdAt: new Date(), updatedAt: new Date(),
      }),
      updateTracking: jest.fn().mockResolvedValue({
        orderFulfillmentPackageId: 'pk1', orderFulfillmentId: 'f1', packageNumber: 'PKG-001',
        trackingNumber: 'TRK456', createdAt: new Date(), updatedAt: new Date(),
      }),
    },
    returns: {},
  },
}));

import { TrackFulfillmentPackageUseCase, TrackFulfillmentPackageCommand } from './TrackFulfillmentPackage';

describe('TrackFulfillmentPackageUseCase', () => {
  let useCase: TrackFulfillmentPackageUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new TrackFulfillmentPackageUseCase();
  });

  it('should create new package (happy path)', async () => {
    const result = await useCase.execute(new TrackFulfillmentPackageCommand(
      'f1', 'PKG-001', 'TRK123',
    ));

    expect(result.orderFulfillmentPackageId).toBe('pk1');
    expect(result.trackingNumber).toBe('TRK123');
  });

  it('should update existing package when ID provided', async () => {
    const result = await useCase.execute(new TrackFulfillmentPackageCommand(
      'f1', 'PKG-001', 'TRK456', undefined, undefined, undefined, undefined, undefined, undefined, 'pk1',
    ));

    expect(result.orderFulfillmentPackageId).toBe('pk1');
    expect(result.trackingNumber).toBe('TRK456');
  });
});
