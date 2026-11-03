import { query, queryOne } from '../../../../libs/db';

export interface InventoryReservationRow {
  reservationId: string;
  inventoryItemId: string;
  orderId: string;
  status: string;
  productId: string;
  variantId?: string;
  sku?: string;
  quantity: number;
  locationId?: string;
  orderItemId?: string;
}

interface DbReservationRow {
  inventoryReservationId: string;
  inventoryItemId: string;
  orderId: string;
  status: string;
  productId: string;
  variantId: string | null;
  sku: string | null;
  quantity: number;
  locationId: string | null;
  orderItemId: string | null;
}

function mapReservation(row: DbReservationRow): InventoryReservationRow {
  return {
    reservationId: row.inventoryReservationId,
    inventoryItemId: row.inventoryItemId,
    orderId: row.orderId,
    status: row.status,
    productId: row.productId,
    variantId: row.variantId ?? undefined,
    sku: row.sku ?? undefined,
    quantity: row.quantity,
    locationId: row.locationId ?? undefined,
    orderItemId: row.orderItemId ?? undefined,
  };
}

/** Checkout-path inventoryReservation persistence (inventoryItemId holds the location id). */
export class InventoryReservationRepo {
  async createReservation(input: {
    reservationId: string;
    orderId: string;
    inventoryItemId: string;
    productId: string;
    variantId?: string;
    sku?: string;
    quantity: number;
    locationId?: string;
    orderItemId?: string;
    expiresAt: Date;
    status: string;
  }): Promise<void> {
    await query(
      `INSERT INTO "inventoryReservation" (
        "inventoryReservationId", "inventoryItemId", "productId", "variantId", "sku",
        "orderId", "locationId", "quantity", "orderItemId", "status", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        input.reservationId,
        input.inventoryItemId,
        input.productId,
        input.variantId ?? null,
        input.sku ?? null,
        input.orderId,
        input.locationId ?? null,
        input.quantity,
        input.orderItemId ?? null,
        input.status,
        input.expiresAt,
        new Date(),
        new Date(),
      ],
    );
  }

  async findReservationById(reservationId: string): Promise<InventoryReservationRow | null> {
    const row = await queryOne<DbReservationRow>(`SELECT * FROM "inventoryReservation" WHERE "inventoryReservationId" = $1`, [
      reservationId,
    ]);
    if (!row) return null;
    return mapReservation(row);
  }

  async findReservationsByOrderId(orderId: string): Promise<InventoryReservationRow[]> {
    const rows = await query<DbReservationRow[]>(`SELECT * FROM "inventoryReservation" WHERE "orderId" = $1`, [orderId]);
    return (rows || []).map(mapReservation);
  }

  async attachReservationsToOrderItem(
    orderId: string,
    productId: string,
    variantId: string | undefined,
    orderItemId: string,
  ): Promise<void> {
    await query(
      `UPDATE "inventoryReservation"
       SET "orderItemId" = $1, "updatedAt" = $2
       WHERE "orderId" = $3 AND "productId" = $4 AND "variantId" IS NOT DISTINCT FROM $5
         AND "orderItemId" IS NULL AND status IN ('active', 'reserved')`,
      [orderItemId, new Date(), orderId, productId, variantId ?? null],
    );
  }

  async updateReservationStatus(reservationId: string, status: string, reason?: string): Promise<void> {
    const now = new Date();
    if (status === 'released' || status === 'expired') {
      await query(
        `UPDATE "inventoryReservation" SET "status" = $1, "releasedReason" = $2, "releasedAt" = $3, "updatedAt" = $4 WHERE "inventoryReservationId" = $5`,
        [status, reason || null, now, now, reservationId],
      );
    } else {
      await query(`UPDATE "inventoryReservation" SET "status" = $1, "updatedAt" = $2 WHERE "inventoryReservationId" = $3`, [
        status,
        now,
        reservationId,
      ]);
    }
  }
}
