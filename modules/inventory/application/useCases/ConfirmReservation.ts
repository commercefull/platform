/**
 * ConfirmReservation Use Case
 *
 * Confirms a previously created reservation, converting it from 'active' to 'confirmed'.
 * This is typically called when an order transitions from pending to confirmed/paid.
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface ConfirmReservationInput {
  reservationId: string;
  orderId?: string;
}

export interface ConfirmReservationOutput {
  reservationId: string;
  confirmed: boolean;
  message: string;
}

interface ReservationRecord {
  reservationId: string;
  orderId: string;
  status: string;
  productId: string;
  quantity: number;
}

interface ConfirmReservationRepositoryPort {
  findReservationById(reservationId: string): Promise<ReservationRecord | null>;
  updateReservationStatus(reservationId: string, status: string, reason?: string): Promise<void>;
}

export class ConfirmReservationUseCase {
  constructor(
    private readonly inventoryRepository: ConfirmReservationRepositoryPort,
  ) {}

  async execute(input: ConfirmReservationInput): Promise<ConfirmReservationOutput> {
    const reservation = await this.inventoryRepository.findReservationById(input.reservationId);

    if (!reservation) {
      return {
        reservationId: input.reservationId,
        confirmed: false,
        message: 'Reservation not found',
      };
    }

    if (reservation.status !== 'active') {
      return {
        reservationId: input.reservationId,
        confirmed: false,
        message: `Reservation is not active (current status: ${reservation.status})`,
      };
    }

    await this.inventoryRepository.updateReservationStatus(input.reservationId, 'confirmed');

    eventBus.emit('inventory.reservation.confirmed', {
      reservationId: input.reservationId,
      orderId: reservation.orderId,
    });

    return {
      reservationId: input.reservationId,
      confirmed: true,
      message: 'Reservation confirmed successfully',
    };
  }
}
