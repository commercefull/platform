import { lazyMock, emitMock } from '../../tests/testUtils';
import { ConfirmReservationUseCase } from './ConfirmReservation';

beforeEach(() => {
  emitMock.mockClear();
});

describe('ConfirmReservationUseCase', () => {
  let useCase: ConfirmReservationUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ConfirmReservationUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof ConfirmReservationUseCase>[0]>();
    mockRepo.findReservationById.mockResolvedValue({ reservationId: 'r1', orderId: 'o1', status: 'active', productId: 'p1', quantity: 5 });
    mockRepo.updateReservationStatus.mockResolvedValue(undefined);
    useCase = new ConfirmReservationUseCase(mockRepo);
  });

  it('should confirm reservation (happy path)', async () => {
    const result = await useCase.execute({ reservationId: 'r1' });

    expect(result.confirmed).toBe(true);
    expect(mockRepo.updateReservationStatus).toHaveBeenCalledWith('r1', 'confirmed');
    expect(emitMock).toHaveBeenCalledWith('inventory.reservation.confirmed', expect.objectContaining({ reservationId: 'r1' }));
  });

  it('should return not confirmed when reservation not found', async () => {
    mockRepo.findReservationById.mockResolvedValue(null);

    const result = await useCase.execute({ reservationId: 'missing' });

    expect(result.confirmed).toBe(false);
    expect(result.message).toBe('Reservation not found');
  });

  it('should return not confirmed when reservation is not active', async () => {
    mockRepo.findReservationById.mockResolvedValue({ reservationId: 'r1', orderId: 'o1', status: 'expired', productId: 'p1', quantity: 5 });

    const result = await useCase.execute({ reservationId: 'r1' });

    expect(result.confirmed).toBe(false);
    expect(result.message).toContain('not active');
  });
});
