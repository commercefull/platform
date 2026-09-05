/**
 * Gift Card Business Controller
 * Handles admin/merchant gift card operations
 */

import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import { activateGiftCard as activateGiftCardRepo, cancelGiftCard as cancelGiftCardRepo, createGiftCard as createGiftCardRepo, getGiftCard as getGiftCardRepo, getGiftCards as getGiftCardsRepo, getTransactions, refundToGiftCard as refundToGiftCardRepo } from '../../infrastructure/repositories/GiftCardRepository';
import { type GiftCardStatus, type GiftCardType, type DeliveryMethod } from '../../infrastructure/repositories/GiftCardRepository';

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
  const { status, purchasedBy, assignedTo, limit, offset } = req.query;
  const result = await getGiftCardsRepo(
    { status: status as GiftCardStatus | undefined, purchasedBy: purchasedBy as string, assignedTo: assignedTo as string },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  res.json({ success: true, ...result });
  
};

export const getGiftCard: AsyncHandler = async (req, res, _next) => {
  const giftCard = await getGiftCardRepo(req.params.id);
  if (!giftCard) {
    res.status(404).json({ success: false, message: 'Gift card not found' });
    return;
  }
  const transactions = await getTransactions(req.params.id);
  res.json({ success: true, data: { ...giftCard, transactions } });
  
};

export const createGiftCard: AsyncHandler = async (req, res, _next) => {
  const body = req.body as CreateGiftCardBody;
  if (body.initialBalance === undefined || body.initialBalance === null) {
    res.status(400).json({ success: false, message: 'initialBalance is required' });
    return;
  }
  const giftCard = await createGiftCardRepo(body);
  res.status(201).json({ success: true, data: giftCard });
  
};

export const activateGiftCard: AsyncHandler = async (req, res, _next) => {
  await activateGiftCardRepo(req.params.id);
  res.json({ success: true, message: 'Gift card activated' });
  
};

export const refundToGiftCard: AsyncHandler = async (req, res, _next) => {
  const adminId = req.user?.userId || req.user?.organizationId;
  const body = req.body as RefundBody;
  const transaction = await refundToGiftCardRepo(req.params.id, body.amount, body.orderId, adminId, body.notes);
  res.json({ success: true, data: transaction });
  
};

export const cancelGiftCard: AsyncHandler = async (req, res, _next) => {
  await cancelGiftCardRepo(req.params.id);
  res.json({ success: true, message: 'Gift card cancelled' });
  
};
