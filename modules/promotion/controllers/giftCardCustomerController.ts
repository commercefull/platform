/**
 * Gift Card Customer Controller
 * Handles customer-facing gift card operations
 */

import { logger } from '../../../libs/logger';
import { Request, Response, NextFunction } from 'express';
import * as giftCardRepo from '../repos/giftCardRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const checkGiftCardBalance: AsyncHandler = async (req, res, next) => {
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
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const redeemGiftCard: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { code, amount, orderId } = req.body;

    const giftCard = await giftCardRepo.getGiftCardByCode(code);
    if (!giftCard) {
      res.status(404).json({ success: false, message: 'Gift card not found' });
      return;
    }

    const transaction = await giftCardRepo.redeemGiftCard(giftCard.promotionGiftCardId, amount, orderId, customerId);

    res.json({ success: true, data: transaction });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyGiftCards: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { limit, offset } = req.query;

    const result = await giftCardRepo.getGiftCards(
      { assignedTo: customerId },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );

    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const reloadGiftCard: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { code, amount, orderId } = req.body;

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
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};
