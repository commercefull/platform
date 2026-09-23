import { queryMock } from '../../tests/testUtils';
import { UpdateShipmentStatusUseCase } from './UpdateShipmentStatus';

describe('UpdateShipmentStatusUseCase', () => {
  let useCase: UpdateShipmentStatusUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    queryMock.mockResolvedValue(undefined);
    useCase = new UpdateShipmentStatusUseCase();
  });

  it('should update the shipment status', async () => {
    await useCase.execute({ shipmentId: 's1', status: 'shipped' });

    expect(queryMock).toHaveBeenCalled();
  });

  it('should update with tracking info', async () => {
    await useCase.execute({ shipmentId: 's1', status: 'delivered', trackingInfo: { carrier: 'UPS' } });

    expect(queryMock).toHaveBeenCalled();
  });

  it('should not throw when the update fails', async () => {
    queryMock.mockRejectedValueOnce(new Error('DB error'));

    await expect(useCase.execute({ shipmentId: 's1', status: 'shipped' })).resolves.toBeUndefined();
  });
});
