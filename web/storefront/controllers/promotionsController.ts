/**
 * Promotions Landing Controller
 * Displays active promotions and coupons available to customers
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { query } from '../../../libs/db';

export const getPromotionsPage = async (req: TypedRequest, res: Response): Promise<void> => {
  const promotionsResult = await query<Array<Record<string, unknown>>>(
    `SELECT * FROM promotion WHERE status = 'active' AND "startDate" <= now() AND "endDate" >= now() ORDER BY priority DESC, "createdAt" DESC LIMIT 20`,
  );

  const couponsResult = await query<Array<Record<string, unknown>>>(
    `SELECT * FROM promotionCoupon WHERE "isActive" = true AND ("endDate" IS NULL OR "endDate" >= now()) AND ("maxUsage" IS NULL OR "maxUsage" > "usedCount") ORDER BY "createdAt" DESC LIMIT 20`,
  );

  storefrontRespond(req, res, 'page/promotions', {
    pageName: 'Promotions & Coupons',
    promotions: promotionsResult || [],
    coupons: couponsResult || [],
    user: req.user,
  });
  
};
