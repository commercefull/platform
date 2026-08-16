/**
 * Gift Card Customer Controller
 * Handles customer-facing gift card operations
 */

import { logger } from '../../../../libs/logger';
import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import * as giftCardRepo from '../../infrastructure/repositories/giftCardRepo';

interface RedeemOrReloadBody {
  code: string;
  amount: number;
  orderId?: string;
}

type AsyncHandler = (req: TypedRequest, res: Response, _next: NextFunction) => Promise<void>;

export const checkGiftCardBalance: AsyncHandler = async (req, res, _next) => {
  try {
    const { code } = req.params;
    const giftCard = await giftCardRepo.getGiftCardByCode(code);

    if (!giftCard) {
      res.status(404).json({ success: false, message: 'Gift card not found' });
      return;
    }

    if (giftCard.status !== 'active') {
      res.status(400).json({ success: false, message: `Gift card is ${giftCard.status}` });
      return;
    }

    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      res.status(400).json({ success: false, message: 'Gift card has expired' });
      return;
    }

    res.json({
      success: true,
      data: {
        code: giftCard.code,
        currentBalance: giftCard.currentBalance,
        currency: giftCard.currency,
        expiresAt: giftCard.expiresAt,
      },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const redeemGiftCard: AsyncHandler = async (req, res, _next) => {
  try {
    const customerId = req.user?.customerId || req.user?.id;
    const { code, amount, orderId } = req.body as RedeemOrReloadBody;

    const giftCard = await giftCardRepo.getGiftCardByCode(code);
    if (!giftCard) {
      res.status(404).json({ success: false, message: 'Gift card not found' });
      return;
    }

    const transaction = await giftCardRepo.redeemGiftCard(giftCard.promotionGiftCardId, amount, orderId, customerId);

    res.json({ success: true, data: transaction });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const getMyGiftCards: AsyncHandler = async (req, res, _next) => {
  try {
    const customerId = req.user?.customerId || req.user?.id;
    const { limit, offset } = req.query;

    const result = await giftCardRepo.getGiftCards(
      { assignedTo: customerId },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );

    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const reloadGiftCard: AsyncHandler = async (req, res, _next) => {
  try {
    const customerId = req.user?.customerId || req.user?.id;
    const { code, amount, orderId } = req.body as RedeemOrReloadBody;

    const giftCard = await giftCardRepo.getGiftCardByCode(code);
    if (!giftCard) {
      res.status(404).json({ success: false, message: 'Gift card not found' });
      return;
    }

    if (giftCard.assignedTo !== customerId) {
      res.status(403).json({ success: false, message: 'Not authorized to reload this gift card' });
      return;
    }

    const transaction = await giftCardRepo.reloadGiftCard(giftCard.promotionGiftCardId, amount, orderId, customerId);

    res.json({ success: true, data: transaction });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
