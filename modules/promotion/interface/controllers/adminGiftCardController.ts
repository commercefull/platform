import { jsonResponse, redirectResponse } from 'libs/apiResponse';
/**
 * Gift Card Controller
 * Handles gift card management for the Admin Hub
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { adminRespond } from '../../../../libs/adminRespond';
import { manageGiftCardsUseCase } from '../../application/wired';

// ============================================================================
// Gift Card Management
// ============================================================================

export const listGiftCards = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const status = req.query.status as string;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await manageGiftCardsUseCase.getGiftCards(
    { status: status as 'pending' | 'active' | 'depleted' | 'expired' | 'cancelled' | 'suspended' | undefined },
    { limit, offset },
  );

  const stats = await manageGiftCardsUseCase.getGiftCardStats();

  adminRespond(req, res, 'promotions/gift-cards/index', {
    pageName: 'Gift Cards',
    giftCards: result.data,
    filters: { status },
    pagination: { limit, offset, total: result.total },
    stats,

    success: req.query.success || null,
  });
};

export const createGiftCardForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'promotions/gift-cards/create', {
    pageName: 'Create Gift Card',
  });
};

interface GiftCardFormFields {
  type?: 'standard' | 'promotional' | 'reward' | 'refund';
  initialBalanceCents: string;
  currency?: string;
  recipientEmail?: string;
  recipientName?: string;
  personalMessage?: string;
  deliveryDate?: string;
  deliveryMethod?: string;
  expiresAt?: string;
  isReloadable?: string;
  minReloadAmountCents?: string;
  maxReloadAmountCents?: string;
  maxBalanceCents?: string;
}

function buildGiftCardRestrictions(body: GiftCardFormFields): { [k: string]: number | undefined } | undefined {
  const { minReloadAmountCents, maxReloadAmountCents, maxBalanceCents } = body;
  if (!(minReloadAmountCents || maxReloadAmountCents || maxBalanceCents)) {
    return undefined;
  }
  const parse = (v?: string): number | undefined => (v ? parseFloat(v) : undefined);
  return {
    minReloadAmountCents: parse(minReloadAmountCents),
    maxReloadAmountCents: parse(maxReloadAmountCents),
    maxBalanceCents: parse(maxBalanceCents),
  };
}

export const createGiftCard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as GiftCardFormFields;

    const giftCard = await manageGiftCardsUseCase.createGiftCard({
      type: body.type || 'standard',
      initialBalanceCents: parseFloat(body.initialBalanceCents),
      currency: body.currency || 'USD',
      recipientEmail: body.recipientEmail || undefined,
      recipientName: body.recipientName || undefined,
      personalMessage: body.personalMessage || undefined,
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
      deliveryMethod: (body.deliveryMethod || 'email') as 'email' | 'sms' | 'print' | 'physical',
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      isReloadable: body.isReloadable === 'true',
      restrictions: buildGiftCardRestrictions(body),
    });

    redirectResponse(res, `/hub/promotions/gift-cards/${giftCard.promotionGiftCardId}?success=Gift card created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    adminRespond(req, res, 'promotions/gift-cards/create', {
      pageName: 'Create Gift Card',
      error: (error as Error).message || 'Failed to create gift card',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const viewGiftCard = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const editGiftCardForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const activateGiftCardAction = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { giftCardId } = req.params;

  await manageGiftCardsUseCase.activateGiftCard(giftCardId);

  jsonResponse(res, 200, { success: true, message: 'Gift card activated successfully' });
};

export const assignGiftCardAction = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { giftCardId } = req.params;
  const body = req.body as HttpRequestBody;
  const { customerId } = body as { customerId: string };

  await manageGiftCardsUseCase.assignGiftCard(giftCardId, customerId);

  jsonResponse(res, 200, { success: true, message: 'Gift card assigned successfully' });
};

export const reloadGiftCardAction = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { giftCardId } = req.params;
  const body = req.body as HttpRequestBody;
  const { amountCents, orderId } = body as { amountCents: string; orderId: string };

  const transaction = await manageGiftCardsUseCase.reloadGiftCard(giftCardId, parseFloat(amountCents), orderId, 'admin');

  jsonResponse(res, 200, {
    success: true,
    message: 'Gift card reloaded successfully',
    transaction,
  });
};

export const refundToGiftCardAction = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { giftCardId } = req.params;
  const body = req.body as HttpRequestBody;
  const { amountCents, orderId, notes } = body as { amountCents: string; orderId: string; notes?: string };

  const transaction = await manageGiftCardsUseCase.refundToGiftCard(giftCardId, parseFloat(amountCents), orderId, 'admin', notes);

  jsonResponse(res, 200, {
    success: true,
    message: 'Refund applied to gift card successfully',
    transaction,
  });
};

export const cancelGiftCardAction = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { giftCardId } = req.params;

  await manageGiftCardsUseCase.cancelGiftCard(giftCardId);

  jsonResponse(res, 200, { success: true, message: 'Gift card cancelled successfully' });
};

export const checkGiftCardBalance = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { code } = req.params;

  const giftCard = await manageGiftCardsUseCase.getGiftCardByCode(code);

  if (!giftCard) {
    jsonResponse(res, 200, { valid: false, message: 'Gift card not found' });
    return;
  }

  jsonResponse(res, 200, {
    valid: true,
    balanceCents: giftCard.currentBalanceCents,
    currency: giftCard.currency,
    status: giftCard.status,
    expiresAt: giftCard.expiresAt,
  });
};
