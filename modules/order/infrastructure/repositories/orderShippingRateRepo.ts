import { query, queryOne } from '../../../../libs/db';
import { unixTimestamp } from '../../../../libs/date';

export type ShippingCarrier = 'ups' | 'usps' | 'fedex' | 'dhl' | 'custom';

export interface OrderShippingRate {
  orderShippingRateId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  carrier: ShippingCarrier;
  serviceLevel: string;
  serviceName: string;
  rate: number;
  estimatedDays?: number;
  estimatedDeliveryDate?: string;
  currencyCode: string;
  isSelected: boolean;
  carrierAccountId?: string;
  shipmentId?: string;
  rateData?: Record<string, any>;
}

export type OrderShippingRateCreateParams = Omit<OrderShippingRate, 'orderShippingRateId' | 'createdAt' | 'updatedAt'>;

export const findByOrder = async (orderId: string): Promise<OrderShippingRate[]> => {
  const results = await query<OrderShippingRate[]>(
    `SELECT * FROM "orderShippingRate" WHERE "orderId" = $1 ORDER BY "rate" ASC`,
    [orderId],
  );
  return results || [];
};

export const create = async (params: OrderShippingRateCreateParams): Promise<OrderShippingRate> => {
  const now = unixTimestamp();
  const result = await queryOne<OrderShippingRate>(
    `INSERT INTO "orderShippingRate" (
      "orderId", "carrier", "serviceLevel", "serviceName", "rate",
      "estimatedDays", "estimatedDeliveryDate", "currencyCode", "isSelected",
      "carrierAccountId", "shipmentId", "rateData",
      "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      params.orderId,
      params.carrier,
      params.serviceLevel,
      params.serviceName,
      params.rate,
      params.estimatedDays || null,
      params.estimatedDeliveryDate || null,
      params.currencyCode || 'USD',
      params.isSelected ?? false,
      params.carrierAccountId || null,
      params.shipmentId || null,
      params.rateData ? JSON.stringify(params.rateData) : null,
      now,
      now,
    ],
  );
  if (!result) throw new Error('Failed to create orderShippingRate');
  return result;
};

export default { findByOrder, create };
