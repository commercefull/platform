/**
 * InventoryReservationPort
 *
 * ACL port owned by checkout. Reserves tracked physical stock while an
 * order awaits payment, then confirms or releases the reservation as the
 * checkout state machine resolves.
 *
 * Items flagged digital or `unlimited` never consume stock; `backorderable`
 * items fully reserve even past available quantity.
 */

export interface InventoryReservationItem {
  productId: string;
  variantId?: string;
  sku?: string;
  quantity: number;
  /** Order line this reservation covers (persisted for traceability). */
  orderItemId?: string;
  isDigital?: boolean;
  inventoryPolicy?: 'tracked' | 'unlimited' | 'backorderable';
}

export interface InventoryReservationResult {
  reservationId?: string;
  allReserved: boolean;
  /** Lines that could not be fully reserved (tracked stock shortfalls). */
  shortfalls: Array<{ productId: string; requestedQuantity: number; reservedQuantity: number }>;
}

export interface InventoryReservationPort {
  reserveForOrder(input: {
    orderId: string;
    storeId?: string;
    channelId?: string;
    items: InventoryReservationItem[];
  }): Promise<InventoryReservationResult>;
  releaseForOrder(orderId: string, reason?: 'cancelled' | 'expired' | 'fulfilled' | 'manual'): Promise<void>;
  confirmForOrder(orderId: string): Promise<void>;
}
