import { jsonResponse } from "libs/apiResponse";
/**
 * Gift Card Customer Controller
 * Handles customer-facing gift card operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { manageGiftCardsUseCase } from '../../application/wired';

interface RedeemOrReloadBody {
  code: string;
  amountCents: number;
  orderId?: string;
}

type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

export const checkGiftCardBalance: AsyncHandler = async (req, res, _next) => {
  const { code } = req.params;
  const giftCard = await manageGiftCardsUseCase.getGiftCardByCode(code);

  if (!giftCard) {
    jsonResponse(res, 404, { success: false, message: 'Gift card not found' });
    return;
  }

  if (giftCard.status !== 'active') {
    jsonResponse(res, 400, { success: false, message: `Gift card is ${giftCard.status}` });
    return;
  }

  if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
    jsonResponse(res, 400, { success: false, message: 'Gift card has expired' });
    return;
  }

  jsonResponse(res, 200, {
        success: true,
        data: {
          code: giftCard.code,
          currentBalanceCents: giftCard.currentBalanceCents,
          currency: giftCard.currency,
          expiresAt: giftCard.expiresAt,
        },
      });
};

export const redeemGiftCard: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { code, amountCents, orderId } = req.body as RedeemOrReloadBody;

  const giftCard = await manageGiftCardsUseCase.getGiftCardByCode(code);
  if (!giftCard) {
    jsonResponse(res, 404, { success: false, message: 'Gift card not found' });
    return;
  }

  const transaction = await manageGiftCardsUseCase.redeemGiftCard(giftCard.promotionGiftCardId, amountCents, orderId, customerId);

  jsonResponse(res, 200, { success: true, data: transaction });
};

export const getMyGiftCards: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { limit, offset } = req.query;

  const result = await manageGiftCardsUseCase.getGiftCards(
    { assignedTo: customerId },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );

  jsonResponse(res, 200, { success: true, ...result });
};

export const reloadGiftCard: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { code, amountCents, orderId } = req.body as RedeemOrReloadBody;

  const giftCard = await manageGiftCardsUseCase.getGiftCardByCode(code);
  if (!giftCard) {
    jsonResponse(res, 404, { success: false, message: 'Gift card not found' });
    return;
  }

  if (giftCard.assignedTo !== customerId) {
    jsonResponse(res, 403, { success: false, message: 'Not authorized to reload this gift card' });
    return;
  }

  const transaction = await manageGiftCardsUseCase.reloadGiftCard(giftCard.promotionGiftCardId, amountCents, orderId, customerId);

  jsonResponse(res, 200, { success: true, data: transaction });
};
