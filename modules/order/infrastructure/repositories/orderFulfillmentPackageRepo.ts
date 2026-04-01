import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

export interface OrderFulfillmentPackage {
  orderFulfillmentPackageId: string;
  createdAt: string;
  updatedAt: string;
  orderFulfillmentId: string;
  packageNumber: string;
  trackingNumber?: string;
  weight?: number;
  dimensions?: Record<string, any>;
  packageType?: string;
  shippingLabelUrl?: string;
  commercialInvoiceUrl?: string;
  customsInfo?: Record<string, any>;
}

export type OrderFulfillmentPackageCreateParams = Omit<OrderFulfillmentPackage, 'orderFulfillmentPackageId' | 'createdAt' | 'updatedAt'>;
export type OrderFulfillmentPackageTrackingParams = Partial<Pick<OrderFulfillmentPackage, 'trackingNumber' | 'shippingLabelUrl' | 'commercialInvoiceUrl'>>;

export const findByFulfillment = async (orderFulfillmentId: string): Promise<OrderFulfillmentPackage[]> => {
  const results = await query<OrderFulfillmentPackage[]>(
    `SELECT * FROM "orderFulfillmentPackage" WHERE "orderFulfillmentId" = $1 ORDER BY "createdAt" ASC`,
    [orderFulfillmentId],
  );
  return results || [];
};

export const create = async (params: OrderFulfillmentPackageCreateParams): Promise<OrderFulfillmentPackage> => {
  const now = unixTimestamp();
  const result = await queryOne<OrderFulfillmentPackage>(
    `INSERT INTO "orderFulfillmentPackage" (
      "orderFulfillmentId", "packageNumber", "trackingNumber", "weight", "dimensions",
      "packageType", "shippingLabelUrl", "commercialInvoiceUrl", "customsInfo",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      params.orderFulfillmentId,
      params.packageNumber,
      params.trackingNumber || null,
      params.weight || null,
      params.dimensions ? JSON.stringify(params.dimensions) : null,
      params.packageType || null,
      params.shippingLabelUrl || null,
      params.commercialInvoiceUrl || null,
      params.customsInfo ? JSON.stringify(params.customsInfo) : null,
      now,
      now,
    ],
  );
  if (!result) throw new Error('Failed to create orderFulfillmentPackage');
  return result;
};

export const updateTracking = async (
  orderFulfillmentPackageId: string,
  params: OrderFulfillmentPackageTrackingParams,
): Promise<OrderFulfillmentPackage | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      fields.push(`"${key}" = $${i++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return queryOne<OrderFulfillmentPackage>(
      `SELECT * FROM "orderFulfillmentPackage" WHERE "orderFulfillmentPackageId" = $1`,
      [orderFulfillmentPackageId],
    );
  }

  fields.push(`"updatedAt" = $${i++}`);
  values.push(unixTimestamp());
  values.push(orderFulfillmentPackageId);

  return queryOne<OrderFulfillmentPackage>(
    `UPDATE "orderFulfillmentPackage" SET ${fields.join(', ')} WHERE "orderFulfillmentPackageId" = $${i} RETURNING *`,
    values,
  );
};

export default { findByFulfillment, create, updateTracking };
