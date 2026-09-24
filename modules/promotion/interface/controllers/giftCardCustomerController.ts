/**
 * Gift Card Customer Controller
 * Handles customer-facing gift card operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { getGiftCardByCode, getGiftCards, redeemGiftCardRepo, reloadGiftCardRepo } from '../../application/wired';

interface RedeemOrReloadBody {
  code: string;
  amountCents: number;
  orderId?: string;
}

type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

export const checkGiftCardBalance: AsyncHandler = async (req, res, _next) => {
  const { code } = req.params;
  const giftCard = await getGiftCardByCode(code);

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
      currentBalanceCents: giftCard.currentBalanceCents,
      currency: giftCard.currency,
      expiresAt: giftCard.expiresAt,
    },
  });
};

export const redeemGiftCard: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { code, amountCents, orderId } = req.body as RedeemOrReloadBody;

  const giftCard = await getGiftCardByCode(code);
  if (!giftCard) {
    res.status(404).json({ success: false, message: 'Gift card not found' });
    return;
  }

  const transaction = await redeemGiftCardRepo(giftCard.promotionGiftCardId, amountCents, orderId, customerId);

  res.json({ success: true, data: transaction });
};

export const getMyGiftCards: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { limit, offset } = req.query;

  const result = await getGiftCards(
    { assignedTo: customerId },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );

  res.json({ success: true, ...result });
};

export const reloadGiftCard: AsyncHandler = async (req, res, _next) => {
  const customerId = req.user?.customerId || req.user?.id;
  const { code, amountCents, orderId } = req.body as RedeemOrReloadBody;

  const giftCard = await getGiftCardByCode(code);
  if (!giftCard) {
    res.status(404).json({ success: false, message: 'Gift card not found' });
    return;
  }

  if (giftCard.assignedTo !== customerId) {
    res.status(403).json({ success: false, message: 'Not authorized to reload this gift card' });
    return;
  }

  const transaction = await reloadGiftCardRepo(giftCard.promotionGiftCardId, amountCents, orderId, customerId);

  res.json({ success: true, data: transaction });
};
