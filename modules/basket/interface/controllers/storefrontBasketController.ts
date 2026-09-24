/**
 * Storefront Basket/Cart Controller
 * Handles shopping cart operations for customers
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { storefrontRespond } from '../../../../libs/storefrontRespond';
import { GetOrCreateBasketCommand } from '../../application/useCases/GetOrCreateBasket';
import { AddItemCommand } from '../../application/useCases/AddItem';
import { UpdateItemQuantityCommand } from '../../application/useCases/UpdateItemQuantity';
import { RemoveItemCommand } from '../../application/useCases/RemoveItem';
import { ClearBasketCommand } from '../../application/useCases/ClearBasket';
import {
  getOrCreateBasketUseCase,
  addItemUseCase,
  updateItemQuantityUseCase,
  removeItemUseCase,
  clearBasketUseCase,
} from '../../application/useCases/wired';
import { GetProductCommand } from '../../../product/application/useCases/GetProduct';
import { getProductUseCase } from '../../../product/application/useCases/wired';
import { CalculateOrderTaxCommand } from '../../../tax/application/useCases/CalculateOrderTax';
import { calculateOrderTaxUseCase } from '../../../tax/application/wired';

// ============================================================================
// View Basket/Cart
// ============================================================================

export const viewBasket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  const getCmd = new GetOrCreateBasketCommand(customerId, sessionId, (res.locals.currency as string) || 'USD', (res.locals.storeId as string) || undefined);
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

export const addToBasket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { productId } = req.params;
    const body = req.body as HttpRequestBody;
    const { quantity = 1, variantId } = body;
    const customerId = req.user?.customerId;
    const sessionId = req.session?.id;

    // Get or create basket
    const getCmd = new GetOrCreateBasketCommand(customerId, sessionId, (res.locals.currency as string) || 'USD', (res.locals.storeId as string) || undefined);
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
      variantId as string | undefined,
      product.primaryImage?.url,
      undefined,
      'physical',
    );

    await addItemUseCase.execute(addCmd);

    // Redirect back to product page or cart with success message
    const redirectTo = (req.body as HttpRequestBody).redirectTo || '/basket';
    res.redirect(redirectTo + '?success=' + encodeURIComponent('Item added to cart'));
  } catch (error: unknown) {
    logger.warn('Error:', error);

    res.redirect('/?error=' + encodeURIComponent((error as Error).message || 'Failed to add item to cart'));
  }
};

// ============================================================================
// Update Basket Item
// ============================================================================

export const updateBasketItem = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketItemId } = req.params;
  const body = req.body as HttpRequestBody;
  const { quantity } = body;
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  const getCmd = new GetOrCreateBasketCommand(customerId, sessionId, (res.locals.currency as string) || 'USD', (res.locals.storeId as string) || undefined);
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

export const removeFromBasket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { basketItemId } = req.params;
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  const getCmd = new GetOrCreateBasketCommand(customerId, sessionId, (res.locals.currency as string) || 'USD', (res.locals.storeId as string) || undefined);
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

export const clearBasket = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const customerId = req.user?.customerId;
  const sessionId = req.session?.id;

  const getCmd = new GetOrCreateBasketCommand(customerId, sessionId, (res.locals.currency as string) || 'USD', (res.locals.storeId as string) || undefined);
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
  const subtotalCents =
    typeof basket.subtotalCents === 'number'
      ? basket.subtotalCents
      : basketItems?.reduce(
          (sum: number, item: Record<string, unknown>) =>
            sum + ((item.lineTotalCents as number) ?? (item.unitPriceCents as number) * (item.quantity as number)),
          0,
        ) || 0;

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
      unitPriceCents: item.unitPriceCents as number,
    })) || [],
    defaultAddress,
    0, // No shipping in basket view
    user?.customerId as string | undefined,
  );

  const taxUseCase = calculateOrderTaxUseCase;
  const taxResult = await taxUseCase.execute(taxCommand);

  const totalCents = subtotalCents + taxResult.taxAmountCents;

  return {
    subtotal: (subtotalCents / 100).toFixed(2),
    tax: (taxResult.taxAmountCents / 100).toFixed(2),
    total: (totalCents / 100).toFixed(2),
    taxRate: taxResult.taxRate,
  };
}
