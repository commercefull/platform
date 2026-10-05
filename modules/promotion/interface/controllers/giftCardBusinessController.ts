import { jsonResponse } from 'libs/apiResponse';
/**
 * Gift Card Business Controller
 * Handles admin/merchant gift card operations
 */

import type { HttpNext, HttpRequest, HttpResponse } from 'libs/http';
import { manageGiftCardsUseCase, type GiftCardStatus, type GiftCardType, type DeliveryMethod } from '../../application/wired';

interface CreateGiftCardBody {
  type?: GiftCardType;
  initialBalanceCents: number;
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
  amountCents: number;
  orderId?: string;
  notes?: string;
}

type AsyncHandler = (req: HttpRequest, res: HttpResponse, _next: HttpNext) => Promise<void>;

export const getGiftCards: AsyncHandler = async (req, res, _next) => {
  const { status, purchasedBy, assignedTo, limit, offset } = req.query;
  const result = await manageGiftCardsUseCase.getGiftCards(
    { status: status as GiftCardStatus | undefined, purchasedBy: purchasedBy as string, assignedTo: assignedTo as string },
    { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
  );
  jsonResponse(res, 200, { success: true, ...result });
};

export const getGiftCard: AsyncHandler = async (req, res, _next) => {
  const giftCard = await manageGiftCardsUseCase.getGiftCard(req.params.id);
  if (!giftCard) {
    jsonResponse(res, 404, { success: false, message: 'Gift card not found' });
    return;
  }
  const transactions = await manageGiftCardsUseCase.getTransactions(req.params.id);
  jsonResponse(res, 200, { success: true, data: { ...giftCard, transactions } });
};

export const createGiftCard: AsyncHandler = async (req, res, _next) => {
  const body = req.body as CreateGiftCardBody;
  if (body.initialBalanceCents === undefined || body.initialBalanceCents === null) {
    jsonResponse(res, 400, { success: false, message: 'initialBalanceCents is required' });
    return;
  }
  const giftCard = await manageGiftCardsUseCase.createGiftCard(body);
  jsonResponse(res, 201, { success: true, data: giftCard });
};

export const activateGiftCard: AsyncHandler = async (req, res, _next) => {
  await manageGiftCardsUseCase.activateGiftCard(req.params.id);
  jsonResponse(res, 200, { success: true, message: 'Gift card activated' });
};

export const assignGiftCard: AsyncHandler = async (req, res, _next) => {
  const { customerId } = req.body as { customerId?: string };
  if (!customerId) {
    jsonResponse(res, 400, { success: false, message: 'customerId is required' });
    return;
  }
  await manageGiftCardsUseCase.assignGiftCard(req.params.id, customerId);
  jsonResponse(res, 200, { success: true, message: 'Gift card assigned' });
};

export const refundToGiftCard: AsyncHandler = async (req, res, _next) => {
  const adminId = req.user?.userId || req.user?.organizationId;
  const body = req.body as RefundBody;
  const transaction = await manageGiftCardsUseCase.refundToGiftCard(req.params.id, body.amountCents, body.orderId, adminId, body.notes);
  jsonResponse(res, 200, { success: true, data: transaction });
};

export const cancelGiftCard: AsyncHandler = async (req, res, _next) => {
  await manageGiftCardsUseCase.cancelGiftCard(req.params.id);
  jsonResponse(res, 200, { success: true, message: 'Gift card cancelled' });
};
