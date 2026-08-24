jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ConfirmReservationUseCase} from './ConfirmReservation';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ConfirmReservationUseCase', () => {
  let useCase: ConfirmReservationUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findReservationById: jest.fn().mockResolvedValue({ reservationId: 'r1', orderId: 'o1', status: 'active', productId: 'p1', quantity: 5 }),
      updateReservationStatus: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ConfirmReservationUseCase(mockRepo as never);
  });

  it('should confirm reservation (happy path)', async () => {
    const result = await useCase.execute({ reservationId: 'r1' });

    expect(result.confirmed).toBe(true);
    expect(mockRepo.updateReservationStatus).toHaveBeenCalledWith('r1', 'confirmed');
    expect(eventBus.emit).toHaveBeenCalledWith('inventory.reservation.confirmed', expect.objectContaining({ reservationId: 'r1' }));
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
