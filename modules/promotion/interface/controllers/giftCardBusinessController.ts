/**
 * Gift Card Business Controller
 * Handles admin/merchant gift card operations
 */

import { logger } from '../../../../libs/logger';
import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import * as giftCardRepo from '../../infrastructure/repositories/giftCardRepo';
import { GiftCardStatus, GiftCardType, DeliveryMethod } from '../../infrastructure/repositories/giftCardRepo';

interface CreateGiftCardBody {
  type?: GiftCardType;
  initialBalance: number;
  currency?: string;
  purchasedBy?: string;
  purchaseOrderId?: string;
  recipientEmail?: string;
  recipientName?: string;
  personalMessage?: string;
  deliveryDate?: Date;
  deliveryMethod?: DeliveryMethod;
  expiresAt?: Date;
  isReloadable?: boolean;
  restrictions?: Record<string, unknown>;
}

interface RefundBody {
  amount: number;
  orderId?: string;
  notes?: string;
}

type AsyncHandler = (req: TypedRequest, res: Response, _next: NextFunction) => Promise<void>;

export const getGiftCards: AsyncHandler = async (req, res, _next) => {
  try {
    const { status, purchasedBy, assignedTo, limit, offset } = req.query;
    const result = await giftCardRepo.getGiftCards(
      { status: status as GiftCardStatus | undefined, purchasedBy: purchasedBy as string, assignedTo: assignedTo as string },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getGiftCard: AsyncHandler = async (req, res, _next) => {
  try {
    const giftCard = await giftCardRepo.getGiftCard(req.params.id);
    if (!giftCard) {
      res.status(404).json({ success: false, message: 'Gift card not found' });
      return;
    }
    const transactions = await giftCardRepo.getTransactions(req.params.id);
    res.json({ success: true, data: { ...giftCard, transactions } });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createGiftCard: AsyncHandler = async (req, res, _next) => {
  try {
    const giftCard = await giftCardRepo.createGiftCard(req.body as CreateGiftCardBody);
    res.status(201).json({ success: true, data: giftCard });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const activateGiftCard: AsyncHandler = async (req, res, _next) => {
  try {
    await giftCardRepo.activateGiftCard(req.params.id);
    res.json({ success: true, message: 'Gift card activated' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const refundToGiftCard: AsyncHandler = async (req, res, _next) => {
  try {
    const adminId = req.user?.userId || req.user?.organizationId;
    const body = req.body as RefundBody;
    const transaction = await giftCardRepo.refundToGiftCard(req.params.id, body.amount, body.orderId, adminId, body.notes);
    res.json({ success: true, data: transaction });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const cancelGiftCard: AsyncHandler = async (req, res, _next) => {
  try {
    await giftCardRepo.cancelGiftCard(req.params.id);
    res.json({ success: true, message: 'Gift card cancelled' });
  } catch (error: unknown) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: (error as Error).message });
  }
};
