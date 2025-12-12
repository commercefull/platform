/**
 * Gift Card Business Controller
 * Handles admin/merchant gift card operations
 */

import { Request, Response, NextFunction } from 'express';
import * as giftCardRepo from '../repos/giftCardRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const getGiftCards: AsyncHandler = async (req, res, next) => {
  try {
    const { status, purchasedBy, assignedTo, limit, offset } = req.query;
    const result = await giftCardRepo.getGiftCards(
      { status: status as any, purchasedBy: purchasedBy as string, assignedTo: assignedTo as string },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 }
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get gift cards error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGiftCard: AsyncHandler = async (req, res, next) => {
  try {
    const giftCard = await giftCardRepo.getGiftCard(req.params.id);
    if (!giftCard) {
      res.status(404).json({ success: false, message: 'Gift card not found' });
      return;
    }
    const transactions = await giftCardRepo.getTransactions(req.params.id);
    res.json({ success: true, data: { ...giftCard, transactions } });
  } catch (error: any) {
    console.error('Get gift card error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createGiftCard: AsyncHandler = async (req, res, next) => {
  try {
    const giftCard = await giftCardRepo.createGiftCard(req.body);
    res.status(201).json({ success: true, data: giftCard });
  } catch (error: any) {
    console.error('Create gift card error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const activateGiftCard: AsyncHandler = async (req, res, next) => {
  try {
    await giftCardRepo.activateGiftCard(req.params.id);
    res.json({ success: true, message: 'Gift card activated' });
  } catch (error: any) {
    console.error('Activate gift card error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const refundToGiftCard: AsyncHandler = async (req, res, next) => {
  try {
    const adminId = (req as any).userId || (req as any).merchantId;
    const transaction = await giftCardRepo.refundToGiftCard(
      req.params.id,
      req.body.amount,
      req.body.orderId,
      adminId,
      req.body.notes
    );
    res.json({ success: true, data: transaction });
  } catch (error: any) {
    console.error('Refund to gift card error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelGiftCard: AsyncHandler = async (req, res, next) => {
  try {
    await giftCardRepo.cancelGiftCard(req.params.id);
    res.json({ success: true, message: 'Gift card cancelled' });
  } catch (error: any) {
    console.error('Cancel gift card error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
