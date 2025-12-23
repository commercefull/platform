/**
 * Gift Card Controller
 * Handles gift card management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import * as giftCardRepo from '../../../modules/promotion/repos/giftCardRepo';
import { adminRespond } from 'web/respond';

// ============================================================================
// Gift Card Management
// ============================================================================

export const listGiftCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await giftCardRepo.getGiftCards(
      { status: status as any },
      { limit, offset }
    );

    // Get total stats
    const totalResult = await giftCardRepo.getGiftCards();
    const totalValue = totalResult.data.reduce((sum: number, card: any) => sum + card.currentBalance, 0);
    const activeCards = totalResult.data.filter((card: any) => card.status === 'active').length;

    adminRespond(req, res, 'promotions/gift-cards/index', {
      pageName: 'Gift Cards',
      giftCards: result.data,
      filters: { status },
      pagination: { limit, offset, total: result.total },
      stats: {
        totalCards: totalResult.total,
        activeCards,
        totalValue
      },
      
      success: req.query.success || null
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load gift cards',
    });
  }
};

export const createGiftCardForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'promotions/gift-cards/create', {
      pageName: 'Create Gift Card',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createGiftCard = async (req: Request, res: Response): Promise<void> => {
  try {
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
      maxBalance
    } = req.body;

    const giftCard = await giftCardRepo.createGiftCard({
      type: type || 'standard',
      initialBalance: parseFloat(initialBalance),
      currency: currency || 'USD',
      recipientEmail: recipientEmail || undefined,
      recipientName: recipientName || undefined,
      personalMessage: personalMessage || undefined,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      deliveryMethod: deliveryMethod as any || 'email',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isReloadable: isReloadable === 'true',
      restrictions: minReloadAmount || maxReloadAmount || maxBalance ? {
        minReloadAmount: minReloadAmount ? parseFloat(minReloadAmount) : undefined,
        maxReloadAmount: maxReloadAmount ? parseFloat(maxReloadAmount) : undefined,
        maxBalance: maxBalance ? parseFloat(maxBalance) : undefined
      } : undefined
    });

    res.redirect(`/hub/promotions/gift-cards/${giftCard.promotionGiftCardId}?success=Gift card created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);
    

    adminRespond(req, res, 'promotions/gift-cards/create', {
      pageName: 'Create Gift Card',
      error: error.message || 'Failed to create gift card',
      formData: req.body,
    });
  }
};

export const viewGiftCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { giftCardId } = req.params;

    const giftCard = await giftCardRepo.getGiftCard(giftCardId);

    if (!giftCard) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Gift card not found',
      });
      return;
    }

    // Get transaction history
    const transactions = await giftCardRepo.getTransactions(giftCardId);

    adminRespond(req, res, 'promotions/gift-cards/view', {
      pageName: `Gift Card: ${giftCard.code}`,
      giftCard,
      transactions,
      
      success: req.query.success || null
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load gift card',
    });
  }
};

export const editGiftCardForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { giftCardId } = req.params;

    const giftCard = await giftCardRepo.getGiftCard(giftCardId);

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
  } catch (error: any) {
    logger.error('Error:', error);
    
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const activateGiftCardAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { giftCardId } = req.params;

    await giftCardRepo.activateGiftCard(giftCardId);

    res.json({ success: true, message: 'Gift card activated successfully' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message || 'Failed to activate gift card' });
  }
};

export const assignGiftCardAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { giftCardId } = req.params;
    const { customerId } = req.body;

    await giftCardRepo.assignGiftCard(giftCardId, customerId);

    res.json({ success: true, message: 'Gift card assigned successfully' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message || 'Failed to assign gift card' });
  }
};

export const reloadGiftCardAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { giftCardId } = req.params;
    const { amount, orderId } = req.body;

    const transaction = await giftCardRepo.reloadGiftCard(giftCardId, parseFloat(amount), orderId, 'admin');

    res.json({
      success: true,
      message: 'Gift card reloaded successfully',
      transaction
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message || 'Failed to reload gift card' });
  }
};

export const refundToGiftCardAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { giftCardId } = req.params;
    const { amount, orderId, notes } = req.body;

    const transaction = await giftCardRepo.refundToGiftCard(giftCardId, parseFloat(amount), orderId, 'admin', notes);

    res.json({
      success: true,
      message: 'Refund applied to gift card successfully',
      transaction
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message || 'Failed to refund to gift card' });
  }
};

export const cancelGiftCardAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { giftCardId } = req.params;

    await giftCardRepo.cancelGiftCard(giftCardId);

    res.json({ success: true, message: 'Gift card cancelled successfully' });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ success: false, message: error.message || 'Failed to cancel gift card' });
  }
};

export const checkGiftCardBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const giftCard = await giftCardRepo.getGiftCardByCode(code);

    if (!giftCard) {
      res.json({ valid: false, message: 'Gift card not found' });
      return;
    }

    res.json({
      valid: true,
      balance: giftCard.currentBalance,
      currency: giftCard.currency,
      status: giftCard.status,
      expiresAt: giftCard.expiresAt
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    res.status(500).json({ valid: false, message: 'Failed to check gift card balance' });
  }
};
