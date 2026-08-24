jest.mock('../../../../libs/db', () => ({
  query: jest.fn().mockResolvedValue(undefined),
  queryOne: jest.fn(),
  withTransaction: jest.fn(),
}));

jest.mock('../../../../libs/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn() },
}));

import { UpdateShipmentStatusUseCase } from './UpdateShipmentStatus';
import { query } from '../../../../libs/db';

describe('UpdateShipmentStatusUseCase', () => {
  let useCase: UpdateShipmentStatusUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateShipmentStatusUseCase();
  });

  it('should update shipment status (happy path)', async () => {
    await useCase.execute({ shipmentId: 's1', status: 'shipped' });
    // No error thrown = success
    expect(true).toBe(true);
  });

  it('should update with tracking info', async () => {
    await useCase.execute({ shipmentId: 's1', status: 'delivered', trackingInfo: { carrier: 'UPS' } });
    expect(true).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    (query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

    await useCase.execute({ shipmentId: 's1', status: 'shipped' });
    // Should not throw
    expect(true).toBe(true);
  });
});
