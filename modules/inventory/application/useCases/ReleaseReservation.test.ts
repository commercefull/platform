/**
 * Unit Tests for ReleaseReservation Use Case
 */

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ReleaseReservationUseCase } from './ReleaseReservation';
import { InventoryValidationError } from '../../domain/errors/InventoryErrors';
import { eventBus } from '../../../../libs/events/eventBus';

describe('ReleaseReservationUseCase', () => {
  let useCase: ReleaseReservationUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findReservationById: jest.fn(),
      findReservationsByOrderId: jest.fn(),
      findById: jest.fn(),
      updateReservedQuantity: jest.fn(),
      updateReservationStatus: jest.fn(),
    };
    useCase = new ReleaseReservationUseCase(mockRepo as never as ConstructorParameters<typeof ReleaseReservationUseCase>[0]);
    jest.mocked(eventBus.emit).mockClear();
  });

  it('should release reservation by reservationId', async () => {
    mockRepo.findReservationById.mockResolvedValue({
      reservationId: 'res-1',
      inventoryItemId: 'inv-1',
      productId: 'prod-1',
      quantity: 10,
      status: 'active',
    });
    mockRepo.findById.mockResolvedValue({ inventoryItemId: 'inv-1', reservedQuantity: 30 });

    const result = await useCase.execute({ reservationId: 'res-1', reason: 'cancelled' });

    expect(result.releasedCount).toBe(1);
    expect(result.items[0].productId).toBe('prod-1');
    expect(result.items[0].releasedQuantity).toBe(10);
    expect(mockRepo.updateReservedQuantity).toHaveBeenCalledWith('inv-1', 20);
    expect(mockRepo.updateReservationStatus).toHaveBeenCalledWith('res-1', 'released', 'cancelled');
    expect(eventBus.emit).toHaveBeenCalledWith('inventory.released', expect.objectContaining({
      reservationId: 'res-1',
      releasedCount: 1,
    }));
  });

  it('should release all reservations by orderId', async () => {
    mockRepo.findReservationsByOrderId.mockResolvedValue([
      { reservationId: 'res-1', inventoryItemId: 'inv-1', productId: 'prod-1', quantity: 10, status: 'active' },
      { reservationId: 'res-2', inventoryItemId: 'inv-2', productId: 'prod-2', quantity: 5, status: 'active' },
    ]);
    mockRepo.findById
      .mockResolvedValueOnce({ inventoryItemId: 'inv-1', reservedQuantity: 10 })
      .mockResolvedValueOnce({ inventoryItemId: 'inv-2', reservedQuantity: 5 });

    const result = await useCase.execute({ orderId: 'ord-1', reason: 'cancelled' });

    expect(result.releasedCount).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(mockRepo.updateReservedQuantity).toHaveBeenCalledTimes(2);
  });

  it('should skip non-active reservations', async () => {
    mockRepo.findReservationsByOrderId.mockResolvedValue([
      { reservationId: 'res-1', inventoryItemId: 'inv-1', productId: 'prod-1', quantity: 10, status: 'released' },
      { reservationId: 'res-2', inventoryItemId: 'inv-2', productId: 'prod-2', quantity: 5, status: 'active' },
    ]);
    mockRepo.findById.mockResolvedValue({ inventoryItemId: 'inv-2', reservedQuantity: 5 });

    const result = await useCase.execute({ orderId: 'ord-1' });

    expect(result.releasedCount).toBe(1);
    expect(result.items[0].productId).toBe('prod-2');
  });

  it('should return empty when no reservations found', async () => {
    mockRepo.findReservationsByOrderId.mockResolvedValue([]);

    const result = await useCase.execute({ orderId: 'ord-1' });

    expect(result.releasedCount).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('should return empty when reservation not found by ID', async () => {
    mockRepo.findReservationById.mockResolvedValue(null);

    const result = await useCase.execute({ reservationId: 'res-x' });

    expect(result.releasedCount).toBe(0);
  });

  it('should skip when inventory item not found', async () => {
    mockRepo.findReservationById.mockResolvedValue({
      reservationId: 'res-1',
      inventoryItemId: 'inv-x',
      productId: 'prod-1',
      quantity: 10,
      status: 'active',
    });
    mockRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute({ reservationId: 'res-1' });

    expect(result.releasedCount).toBe(0);
  });

  it('should mark as fulfilled when reason is fulfilled', async () => {
    mockRepo.findReservationById.mockResolvedValue({
      reservationId: 'res-1',
      inventoryItemId: 'inv-1',
      productId: 'prod-1',
      quantity: 10,
      status: 'active',
    });
    mockRepo.findById.mockResolvedValue({ inventoryItemId: 'inv-1', reservedQuantity: 10 });

    await useCase.execute({ reservationId: 'res-1', reason: 'fulfilled' });

    expect(mockRepo.updateReservationStatus).toHaveBeenCalledWith('res-1', 'fulfilled', 'fulfilled');
  });

  it('should throw when neither reservationId nor orderId provided', async () => {
    await expect(useCase.execute({})).rejects.toThrow(InventoryValidationError);
  });
});
