/**
 * InventoryReservationAdapter
 *
 * ACL adapter implementing checkout's InventoryReservationPort.
 * Delegates to inventory's ReserveStock / ReleaseReservation /
 * ConfirmReservation use cases.
 *
 * Only this adapter may import from inventory's application layer.
 */

import type {
  InventoryReservationPort,
  InventoryReservationResult,
  InventoryReservationItem,
} from '../../application/ports/InventoryReservationPort';
import type { ReserveStockUseCase } from '../../../inventory/application/useCases/ReserveStock';
import type { ReleaseReservationUseCase } from '../../../inventory/application/useCases/ReleaseReservation';
import type { ConfirmReservationUseCase } from '../../../inventory/application/useCases/ConfirmReservation';
import { logger } from '../../../../libs/logger';

export class InventoryReservationAdapter implements InventoryReservationPort {
  constructor(
    private readonly reserveStock: Pick<ReserveStockUseCase, 'execute'>,
    private readonly releaseReservation: Pick<ReleaseReservationUseCase, 'execute'>,
    private readonly confirmReservation: Pick<ConfirmReservationUseCase, 'execute'>,
  ) {}

  async reserveForOrder(input: {
    orderId: string;
    storeId?: string;
    channelId?: string;
    items: InventoryReservationItem[];
  }): Promise<InventoryReservationResult> {
    const output = await this.reserveStock.execute({
      orderId: input.orderId,
      storeId: input.storeId,
      channelId: input.channelId,
      items: input.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        quantity: item.quantity,
        orderItemId: item.orderItemId,
        isDigital: item.isDigital,
        inventoryPolicy: item.inventoryPolicy,
      })),
    });

    return {
      reservationId: output.reservationId,
      allReserved: output.allReserved,
      shortfalls: output.results
        .filter(r => !r.isFullyReserved)
        .map(r => ({ productId: r.productId, requestedQuantity: r.requestedQuantity, reservedQuantity: r.reservedQuantity })),
    };
  }

  async releaseForOrder(orderId: string, reason: 'cancelled' | 'expired' | 'fulfilled' | 'manual' = 'cancelled'): Promise<void> {
    try {
      await this.releaseReservation.execute({ orderId, reason });
    } catch (error: unknown) {
      // Releasing reservations must never break the caller's state machine —
      // a sweeper job can pick up expired reservations later.
      logger.warn('Inventory reservation release failed', {
        orderId,
        reason,
        error: (error as Error).message,
      });
    }
  }

  async confirmForOrder(orderId: string): Promise<void> {
    try {
      await this.confirmReservation.execute({ orderId });
    } catch (error: unknown) {
      logger.warn('Inventory reservation confirmation failed', {
        orderId,
        error: (error as Error).message,
      });
    }
  }
}
