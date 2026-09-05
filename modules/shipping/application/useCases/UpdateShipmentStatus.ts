/**
 * Update Shipment Status Use Case
 *
 * Updates the status of a shipment in the database.
 */

import { query } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';

export interface UpdateShipmentStatusInput {
  shipmentId: string;
  status: string;
  trackingInfo?: unknown;
}

export class UpdateShipmentStatusUseCase {
  async execute(input: UpdateShipmentStatusInput): Promise<void> {
    try {
      await query(
        `UPDATE "shipment" SET status = $1, "updatedAt" = now() WHERE "shipmentId" = $2`,
        [input.status, input.shipmentId],
      );
      if (input.trackingInfo) {
        logger.info(`updateShipmentStatus: updated shipment ${input.shipmentId} to ${input.status} with tracking info`);
      } else {
        logger.info(`updateShipmentStatus: updated shipment ${input.shipmentId} to ${input.status}`);
      }
    } catch (err: unknown) {
      logger.warn(`updateShipmentStatus error: ${(err as Error).message}`);
    }
  }
}
