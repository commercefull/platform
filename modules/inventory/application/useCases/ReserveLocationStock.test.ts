import { ReserveLocationStockUseCase, type LocationReservationPort } from './ReserveLocationStock';
import { ReleaseLocationReservationUseCase, type ReleaseLocationReservationPort } from './ReleaseLocationReservation';
import { eventBus } from '../../../../libs/events/eventBus';
import { InventoryLocationNotFoundError, InventoryValidationError } from '../../domain/errors/InventoryErrors';
import { lazyMock } from '../../tests/testUtils';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

const emitMock = eventBus.emit as jest.Mock;
const location = { inventoryLocationId: 'loc-1', availableQuantity: 5 };

describe('ReserveLocationStockUseCase', () => {
  let port: jest.Mocked<LocationReservationPort>;
  let useCase: ReserveLocationStockUseCase;

  beforeEach(() => {
    port = lazyMock<LocationReservationPort>();
    useCase = new ReserveLocationStockUseCase(port);
    emitMock.mockClear();
  });

  it('should reject a non-positive quantity', async () => {
    await expect(useCase.execute({ inventoryLocationId: 'loc-1', quantity: 0 })).rejects.toBeInstanceOf(
      InventoryValidationError,
    );
    expect(port.reserveQuantity).not.toHaveBeenCalled();
  });

  it('should throw when the location does not exist', async () => {
    port.findLocationById.mockResolvedValue(null);
    await expect(useCase.execute({ inventoryLocationId: 'loc-x', quantity: 2 })).rejects.toBeInstanceOf(
      InventoryLocationNotFoundError,
    );
  });

  it('should reserve the quantity and emit inventory.reserved', async () => {
    port.findLocationById.mockResolvedValue(location);
    port.reserveQuantity.mockResolvedValue(location);

    const result = await useCase.execute({ inventoryLocationId: 'loc-1', quantity: 2, orderId: 'ord-1' });

    expect(port.reserveQuantity).toHaveBeenCalledWith('loc-1', 2);
    expect(emitMock).toHaveBeenCalledWith('inventory.reserved', {
      inventoryLocationId: 'loc-1',
      quantity: 2,
      orderId: 'ord-1',
      basketId: undefined,
    });
    expect(result).toBe(location);
  });
});

describe('ReleaseLocationReservationUseCase', () => {
  let port: jest.Mocked<ReleaseLocationReservationPort>;
  let useCase: ReleaseLocationReservationUseCase;

  beforeEach(() => {
    port = lazyMock<ReleaseLocationReservationPort>();
    useCase = new ReleaseLocationReservationUseCase(port);
    emitMock.mockClear();
  });

  it('should reject a non-positive quantity', async () => {
    await expect(useCase.execute('loc-1', -1)).rejects.toBeInstanceOf(InventoryValidationError);
    expect(port.releaseReservation).not.toHaveBeenCalled();
  });

  it('should throw when the location does not exist', async () => {
    port.findLocationById.mockResolvedValue(null);
    await expect(useCase.execute('loc-x', 2)).rejects.toBeInstanceOf(InventoryLocationNotFoundError);
  });

  it('should release the quantity and emit inventory.released', async () => {
    port.findLocationById.mockResolvedValue(location);
    port.releaseReservation.mockResolvedValue(location);

    const result = await useCase.execute('loc-1', 3);

    expect(port.releaseReservation).toHaveBeenCalledWith('loc-1', 3);
    expect(emitMock).toHaveBeenCalledWith('inventory.released', { inventoryLocationId: 'loc-1', quantity: 3 });
    expect(result).toBe(location);
  });
});
