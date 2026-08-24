/**
 * Storefront Basket/Cart Controller
 * Handles shopping cart operations for customers
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { GetOrCreateBasketCommand } from '../../../modules/basket/application/useCases/GetOrCreateBasket';
import { AddItemCommand } from '../../../modules/basket/application/useCases/AddItem';
import { UpdateItemQuantityCommand } from '../../../modules/basket/application/useCases/UpdateItemQuantity';
import { RemoveItemCommand } from '../../../modules/basket/application/useCases/RemoveItem';
import { ClearBasketCommand } from '../../../modules/basket/application/useCases/ClearBasket';
import {
  getOrCreateBasketUseCase,
  addItemUseCase,
  updateItemQuantityUseCase,
  removeItemUseCase,
  clearBasketUseCase,
} from '../../../modules/basket/application/useCases/wired';
import { GetProductCommand } from '../../../modules/product/application/useCases/GetProduct';
import { getProductUseCase } from '../../../modules/product/application/useCases/wired';
import { CalculateOrderTaxCommand, CalculateOrderTaxUseCase } from '../../../modules/tax/application/useCases/CalculateOrderTax';

// ============================================================================
// View Basket/Cart
// ============================================================================

export const viewBasket = async (req: TypedRequest, res: Response): Promise<void> => {
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  const getCmd = new GetOrCreateBasketCommand(customerId, sessionId);
  const basket = await getOrCreateBasketUseCase.execute(getCmd);

  // Calculate totals with tax
  const totals = await calculateBasketTotals(basket as unknown as Record<string, unknown>, req.user as Record<string, unknown> | undefined);

  storefrontRespond(req, res, 'basket/basket', {
    pageName: 'Shopping Cart',
    basket: { ...basket, totals },
  });
  
};

// ============================================================================
// Add Item to Basket
// ============================================================================

export const addToBasket = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const body = req.body as RequestBody;
    const { quantity = 1, variantId } = body;
    const customerId = req.user?.customerId;
    const sessionId = req.session?.id;

    // Get or create basket
    const getCmd = new GetOrCreateBasketCommand(customerId, sessionId);
    const basket = await getOrCreateBasketUseCase.execute(getCmd);

    // Verify product exists and is available
    const productCmd = new GetProductCommand(productId);
    const product = await getProductUseCase.execute(productCmd);

    if (!product || product.status !== 'active') {
      return res.redirect('/?error=' + encodeURIComponent('Product not found or unavailable'));
    }

    const addCmd = new AddItemCommand(
      basket.basketId,
      product.productId,
      product.sku || product.productId,
      product.name,
      parseInt(quantity as string),
      product.effectivePrice ?? product.basePrice ?? 0,
      variantId as string | undefined,
      product.primaryImage?.url,
      undefined,
      product.hasVariants ? 'physical' : 'physical',
    );

    await addItemUseCase.execute(addCmd);

    // Redirect back to product page or cart with success message
    const redirectTo = (req.body as RequestBody).redirectTo || '/basket';
    res.redirect(redirectTo + '?success=' + encodeURIComponent('Item added to cart'));
  } catch (error: unknown) {
    logger.warn('Error:', error);

    res.redirect('/?error=' + encodeURIComponent((error as Error).message || 'Failed to add item to cart'));
  }
};

// ============================================================================
// Update Basket Item
// ============================================================================

export const updateBasketItem = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketItemId } = req.params;
  const body = req.body as RequestBody;
  const { quantity } = body;
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  const getCmd = new GetOrCreateBasketCommand(customerId, sessionId);
  const basket = await getOrCreateBasketUseCase.execute(getCmd);

  const updCmd = new UpdateItemQuantityCommand(basket.basketId, basketItemId, parseInt(quantity as string));

  await updateItemQuantityUseCase.execute(updCmd);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.json({ success: true });
  } else {
    res.redirect('/basket?success=' + encodeURIComponent('Cart updated'));
  }
  
};

// ============================================================================
// Remove Item from Basket
// ============================================================================

export const removeFromBasket = async (req: TypedRequest, res: Response): Promise<void> => {
  const { basketItemId } = req.params;
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  const getCmd = new GetOrCreateBasketCommand(customerId, sessionId);
  const basket = await getOrCreateBasketUseCase.execute(getCmd);

  const remCmd = new RemoveItemCommand(basket.basketId, basketItemId);
  await removeItemUseCase.execute(remCmd);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.json({ success: true });
  } else {
    res.redirect('/basket?success=' + encodeURIComponent('Item removed from cart'));
  }
  
};

// ============================================================================
// Clear Basket
// ============================================================================

export const clearBasket = async (req: TypedRequest, res: Response): Promise<void> => {
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  const getCmd = new GetOrCreateBasketCommand(customerId, sessionId);
  const basket = await getOrCreateBasketUseCase.execute(getCmd);

  const clrCmd = new ClearBasketCommand(basket.basketId);
  await clearBasketUseCase.execute(clrCmd);

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.json({ success: true });
  } else {
    res.redirect('/basket?success=' + encodeURIComponent('Cart cleared'));
  }
  
};

// ============================================================================
// Helper Functions
// ============================================================================

async function calculateBasketTotals(basket: Record<string, unknown>, user: Record<string, unknown> | undefined) {
  const basketItems = basket.items as Record<string, unknown>[] | undefined;
  const subtotal =
    typeof basket.subtotal === 'number'
      ? basket.subtotal
      : basketItems?.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.lineTotal as number) ?? (item.unitPrice as number) * (item.quantity as number)), 0) || 0;

  // Use a default US address for basket tax calculation (will be recalculated at checkout with actual address)
  const defaultAddress = {
    country: 'US',
    region: '',
    postalCode: '',
    city: '',
  };

  // Calculate tax using the tax service
  const taxCommand = new CalculateOrderTaxCommand(
    basketItems?.map((item: Record<string, unknown>) => ({
      productId: item.productId as string,
      name: item.name as string,
      quantity: item.quantity as number,
      unitPrice: item.unitPrice as number,
    })) || [],
    defaultAddress,
    0, // No shipping in basket view
    user?.customerId as string | undefined,
  );

  const taxUseCase = new CalculateOrderTaxUseCase();
  const taxResult = await taxUseCase.execute(taxCommand);

  const total = subtotal + taxResult.taxAmount;

  return {
    subtotal: subtotal.toFixed(2),
    tax: taxResult.taxAmount.toFixed(2),
    total: total.toFixed(2),
    taxRate: taxResult.taxRate,
  };
}
