import type { HttpRequest, HttpResponse } from 'libs/http';
import { managePromotionTargetsUseCase, type PromotionCart } from '../../application/wired';

type CartCreateProps = Pick<PromotionCart, 'basketId' | 'promotionId' | 'discountAmountCents' | 'status'> &
  Partial<Pick<PromotionCart, 'promotionCouponId' | 'couponCode' | 'currencyCode' | 'appliedBy'>>;

interface CartPromotionBody extends CartCreateProps {
  createdBy?: string;
  updatedBy?: string;
}

// Get cart promotions by basket ID
export const getPromotionsByCartId = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { cartId } = req.params;
  const promotions = await managePromotionTargetsUseCase.getCartPromotionsByBasketId(cartId);
  res.status(200).json({ success: true, data: promotions || [] });
};

// Get promotion by ID
export const getCartPromotionById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const promotion = await managePromotionTargetsUseCase.getCartPromotionById(id);

  if (!promotion) {
    res.status(404).json({ success: false, message: 'Cart promotion not found' });
    return;
  }

  res.status(200).json({ success: true, data: promotion });
};

// Apply a promotion to a cart
export const applyPromotion = async (
  req: HttpRequest<Record<string, string>, unknown, CartPromotionBody>,
  res: HttpResponse,
): Promise<void> => {
  const promotionData = req.body;

  const promotion = await managePromotionTargetsUseCase.createCartPromotion(promotionData);
  res.status(201).json({ success: true, data: promotion });
};

// Update a cart promotion
export const updateCartPromotion = async (
  req: HttpRequest<Record<string, string>, unknown, Partial<Pick<PromotionCart, 'discountAmountCents' | 'status'>>>,
  res: HttpResponse,
): Promise<void> => {
  const { id } = req.params;
  const promotionData = req.body;

  const promotion = await managePromotionTargetsUseCase.updateCartPromotion(id, promotionData);
  res.status(200).json({ success: true, data: promotion });
};

// Remove a promotion from a cart
export const removePromotion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  await managePromotionTargetsUseCase.deleteCartPromotion(id);
  res.status(200).json({ success: true, message: 'Cart promotion removed successfully' });
};
