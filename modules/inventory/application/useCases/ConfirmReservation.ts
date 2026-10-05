/**
 * ConfirmReservation Use Case
 *
 * Confirms previously created reservations, converting them from 'active' to 'confirmed'.
 * This is typically called when an order transitions from pending to confirmed/paid.
 * Accepts either a single reservationId or an orderId (confirms all active
 * reservations for that order — the checkout completion path only knows the order).
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { InventoryValidationError } from '../../domain/errors/InventoryErrors';

export interface ConfirmReservationInput {
  reservationId?: string;
  orderId?: string;
}

export interface ConfirmReservationOutput {
  reservationId: string;
  confirmed: boolean;
  confirmedCount?: number;
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
  findReservationsByOrderId(orderId: string): Promise<ReservationRecord[]>;
  updateReservationStatus(reservationId: string, status: string, reason?: string): Promise<void>;
}

export class ConfirmReservationUseCase {
  constructor(private readonly inventoryRepository: ConfirmReservationRepositoryPort) {}

  async execute(input: ConfirmReservationInput): Promise<ConfirmReservationOutput> {
    if (!input.reservationId && !input.orderId) {
      throw new InventoryValidationError('Either reservationId or orderId must be provided');
    }

    if (input.orderId) {
      const reservations = (await this.inventoryRepository.findReservationsByOrderId(input.orderId)).filter(r => r.status === 'active');
      for (const reservation of reservations) {
        await this.inventoryRepository.updateReservationStatus(reservation.reservationId, 'confirmed');
      }
      if (reservations.length > 0) {
        eventBus.emit('inventory.reservation.confirmed', {
          reservationId: reservations[0].reservationId,
          orderId: input.orderId,
          confirmedCount: reservations.length,
        });
      }
      return {
        reservationId: reservations[0]?.reservationId ?? '',
        confirmed: reservations.length > 0,
        confirmedCount: reservations.length,
        message: reservations.length > 0 ? 'Reservations confirmed successfully' : 'No active reservations for order',
      };
    }

    const reservation = await this.inventoryRepository.findReservationById(input.reservationId!);

    if (!reservation) {
      return {
        reservationId: input.reservationId!,
        confirmed: false,
        message: 'Reservation not found',
      };
    }

    if (reservation.status !== 'active') {
      return {
        reservationId: input.reservationId!,
        confirmed: false,
        message: `Reservation is not active (current status: ${reservation.status})`,
      };
    }

    await this.inventoryRepository.updateReservationStatus(input.reservationId!, 'confirmed');

    eventBus.emit('inventory.reservation.confirmed', {
      reservationId: input.reservationId,
      orderId: reservation.orderId,
    });

    return {
      reservationId: input.reservationId!,
      confirmed: true,
      message: 'Reservation confirmed successfully',
    };
  }
}
