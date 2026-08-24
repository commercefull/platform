/**
 * Gift Card Controller
 * Handles gift card management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageGiftCardsUseCase } from '../../../modules/promotion/application/useCases/ManagePromotions';
import { adminRespond } from '../../respond';

const manageGiftCardsUseCase = new ManageGiftCardsUseCase();

// ============================================================================
// Gift Card Management
// ============================================================================

export const listGiftCards = async (req: TypedRequest, res: Response): Promise<void> => {
  const status = req.query.status as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await manageGiftCardsUseCase.getGiftCards({ status: status as 'pending' | 'active' | 'depleted' | 'expired' | 'cancelled' | 'suspended' | undefined }, { limit, offset });

  // Get total stats
  const totalResult = await manageGiftCardsUseCase.getGiftCards();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalValue = totalResult.data.reduce((sum: number, card: any) => sum + card.currentBalance, 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeCards = totalResult.data.filter((card: any) => card.status === 'active').length;

  adminRespond(req, res, 'promotions/gift-cards/index', {
    pageName: 'Gift Cards',
    giftCards: result.data,
    filters: { status },
    pagination: { limit, offset, total: result.total },
    stats: {
      totalCards: totalResult.total,
      activeCards,
      totalValue,
    },

    success: req.query.success || null,
  });
  
};

export const createGiftCardForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'promotions/gift-cards/create', {
    pageName: 'Create Gift Card',
  });
  
};

export const createGiftCard = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const {
      type,
      initialBalance,
      currency,
      recipientEmail,
      recipientName,
      personalMessage,
      deliveryDate,
      deliveryMethod,
      expiresAt,
      isReloadable,
      minReloadAmount,
      maxReloadAmount,
      maxBalance,
    } = body;

    const giftCard = await manageGiftCardsUseCase.createGiftCard({
      type: type || 'standard',
      initialBalance: parseFloat(initialBalance),
      currency: currency || 'USD',
      recipientEmail: recipientEmail || undefined,
      recipientName: recipientName || undefined,
      personalMessage: personalMessage || undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      deliveryMethod: (deliveryMethod || 'email') as 'email' | 'sms' | 'print' | 'physical',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isReloadable: isReloadable === 'true',
      restrictions:
        minReloadAmount || maxReloadAmount || maxBalance
          ? {
              minReloadAmount: minReloadAmount ? parseFloat(minReloadAmount) : undefined,
              maxReloadAmount: maxReloadAmount ? parseFloat(maxReloadAmount) : undefined,
              maxBalance: maxBalance ? parseFloat(maxBalance) : undefined,
            }
          : undefined,
    });

    res.redirect(`/hub/promotions/gift-cards/${giftCard.promotionGiftCardId}?success=Gift card created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'promotions/gift-cards/create', {
      pageName: 'Create Gift Card',
      error: (error as Error).message || 'Failed to create gift card',
      formData: req.body as RequestBody,
    });
  }
};

export const viewGiftCard = async (req: TypedRequest, res: Response): Promise<void> => {
  const { giftCardId } = req.params;

  const giftCard = await manageGiftCardsUseCase.getGiftCard(giftCardId);

  if (!giftCard) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Gift card not found',
    });
    return;
  }

  // Get transaction history
  const transactions = await manageGiftCardsUseCase.getTransactions(giftCardId);

  adminRespond(req, res, 'promotions/gift-cards/view', {
    pageName: `Gift Card: ${giftCard.code}`,
    giftCard,
    transactions,

    success: req.query.success || null,
  });
  
};

export const editGiftCardForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { giftCardId } = req.params;

  const giftCard = await manageGiftCardsUseCase.getGiftCard(giftCardId);

  if (!giftCard) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Gift card not found',
    });
    return;
  }

  adminRespond(req, res, 'promotions/gift-cards/edit', {
    pageName: `Edit: ${giftCard.code}`,
    giftCard,
  });
  
};

export const activateGiftCardAction = async (req: TypedRequest, res: Response): Promise<void> => {
  const { giftCardId } = req.params;

  await manageGiftCardsUseCase.activateGiftCard(giftCardId);

  res.json({ success: true, message: 'Gift card activated successfully' });
  
};

export const assignGiftCardAction = async (req: TypedRequest, res: Response): Promise<void> => {
  const { giftCardId } = req.params;
  const body = req.body as RequestBody;
  const { customerId } = body;

  await manageGiftCardsUseCase.assignGiftCard(giftCardId, customerId);

  res.json({ success: true, message: 'Gift card assigned successfully' });
  
};

export const reloadGiftCardAction = async (req: TypedRequest, res: Response): Promise<void> => {
  const { giftCardId } = req.params;
  const body = req.body as RequestBody;
  const { amount, orderId } = body;

  const transaction = await manageGiftCardsUseCase.reloadGiftCard(giftCardId, parseFloat(amount), orderId, 'admin');

  res.json({
    success: true,
    message: 'Gift card reloaded successfully',
    transaction,
  });
  
};

export const refundToGiftCardAction = async (req: TypedRequest, res: Response): Promise<void> => {
  const { giftCardId } = req.params;
  const body = req.body as RequestBody;
  const { amount, orderId, notes } = body;

  const transaction = await manageGiftCardsUseCase.refundToGiftCard(giftCardId, parseFloat(amount), orderId, 'admin', notes);

  res.json({
    success: true,
    message: 'Refund applied to gift card successfully',
    transaction,
  });
  
};

export const cancelGiftCardAction = async (req: TypedRequest, res: Response): Promise<void> => {
  const { giftCardId } = req.params;

  await manageGiftCardsUseCase.cancelGiftCard(giftCardId);

  res.json({ success: true, message: 'Gift card cancelled successfully' });
  
};

export const checkGiftCardBalance = async (req: TypedRequest, res: Response): Promise<void> => {
  const { code } = req.params;

  const giftCard = await manageGiftCardsUseCase.getGiftCardByCode(code);

  if (!giftCard) {
    res.json({ valid: false, message: 'Gift card not found' });
    return;
  }

  res.json({
    valid: true,
    balance: giftCard.currentBalance,
    currency: giftCard.currency,
    status: giftCard.status,
    expiresAt: giftCard.expiresAt,
  });
  
};
