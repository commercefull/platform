/**
 * Storefront Basket/Cart Controller
 * Handles shopping cart operations for customers
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { storefrontRespond } from '../../respond';
import BasketRepo from '../../../modules/basket/infrastructure/repositories/BasketRepository';
import ProductRepo from '../../../modules/product/infrastructure/repositories/ProductRepository';
import { GetOrCreateBasketCommand, GetOrCreateBasketUseCase } from '../../../modules/basket/application/useCases/GetOrCreateBasket';
import { AddItemCommand, AddItemUseCase } from '../../../modules/basket/application/useCases/AddItem';
import { UpdateItemQuantityCommand, UpdateItemQuantityUseCase } from '../../../modules/basket/application/useCases/UpdateItemQuantity';
import { RemoveItemCommand, RemoveItemUseCase } from '../../../modules/basket/application/useCases/RemoveItem';
import { ClearBasketCommand, ClearBasketUseCase } from '../../../modules/basket/application/useCases/ClearBasket';
import { GetProductCommand, GetProductUseCase } from '../../../modules/product/application/useCases/GetProduct';
import { CalculateOrderTaxCommand, CalculateOrderTaxUseCase } from '../../../modules/tax/application/useCases/CalculateOrderTax';

// ============================================================================
// View Basket/Cart
// ============================================================================

export const viewBasket = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId;
    const sessionId = (req as any).session?.id;

    const getCmd = new GetOrCreateBasketCommand(customerId, sessionId);
    const getUc = new GetOrCreateBasketUseCase(BasketRepo);
    const basket = await getUc.execute(getCmd);

    // Calculate totals with tax
    const totals = await calculateBasketTotals(basket, req.user);

    storefrontRespond(req, res, 'basket/basket', {
      pageName: 'Shopping Cart',
      basket: { ...basket, totals }
    });
  } catch (error: any) {
    logger.error('Error:', error);
    
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load shopping cart'
    });
  }
};

// ============================================================================
// Add Item to Basket
// ============================================================================

export const addToBasket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { quantity = 1, variantId } = req.body;
    const customerId = (req as any).user?.customerId;
    const sessionId = (req as any).session?.id;

    // Get or create basket
    const getCmd = new GetOrCreateBasketCommand(customerId, sessionId);
    const getUc = new GetOrCreateBasketUseCase(BasketRepo);
    const basket = await getUc.execute(getCmd);

    // Verify product exists and is available
    const productCmd = new GetProductCommand(productId);
    const productUc = new GetProductUseCase(ProductRepo);
    const product = await productUc.execute(productCmd);

    if (!product || product.status !== 'active') {
      return res.redirect('/?error=' + encodeURIComponent('Product not found or unavailable'));
    }

    const addCmd = new AddItemCommand(
      basket.basketId,
      product.productId,
      product.sku || product.productId,
      product.name,
      parseInt(quantity as string),
      (product.effectivePrice ?? product.basePrice ?? 0),
      variantId,
      product.primaryImage?.url,
      undefined,
      product.hasVariants ? 'physical' : 'physical'
    );

    const addUc = new AddItemUseCase(BasketRepo);
    await addUc.execute(addCmd);

    // Redirect back to product page or cart with success message
    const redirectTo = req.body.redirectTo || '/basket';
    res.redirect(redirectTo + '?success=' + encodeURIComponent('Item added to cart'));

  } catch (error: any) {
    logger.error('Error:', error);
    
    res.redirect('/?error=' + encodeURIComponent(error.message || 'Failed to add item to cart'));
  }
};

// ============================================================================
// Update Basket Item
// ============================================================================

export const updateBasketItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketItemId } = req.params;
    const { quantity } = req.body;
    const customerId = (req as any).user?.customerId;
    const sessionId = (req as any).session?.id;

    const getCmd = new GetOrCreateBasketCommand(customerId, sessionId);
    const getUc = new GetOrCreateBasketUseCase(BasketRepo);
    const basket = await getUc.execute(getCmd);

    const updCmd = new UpdateItemQuantityCommand(
      basket.basketId,
      basketItemId,
      parseInt(quantity as string)
    );

    const updUc = new UpdateItemQuantityUseCase(BasketRepo);
    await updUc.execute(updCmd);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true });
    } else {
      res.redirect('/basket?success=' + encodeURIComponent('Cart updated'));
    }
  } catch (error: any) {
    logger.error('Error:', error);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.redirect('/basket?error=' + encodeURIComponent(error.message || 'Failed to update cart'));
    }
  }
};

// ============================================================================
// Remove Item from Basket
// ============================================================================

export const removeFromBasket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { basketItemId } = req.params;
    const customerId = (req as any).user?.customerId;
    const sessionId = (req as any).session?.id;

    const getCmd = new GetOrCreateBasketCommand(customerId, sessionId);
    const getUc = new GetOrCreateBasketUseCase(BasketRepo);
    const basket = await getUc.execute(getCmd);

    const remCmd = new RemoveItemCommand(basket.basketId, basketItemId);
    const remUc = new RemoveItemUseCase(BasketRepo);
    await remUc.execute(remCmd);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true });
    } else {
      res.redirect('/basket?success=' + encodeURIComponent('Item removed from cart'));
    }
  } catch (error: any) {
    logger.error('Error:', error);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.redirect('/basket?error=' + encodeURIComponent(error.message || 'Failed to remove item'));
    }
  }
};

// ============================================================================
// Clear Basket
// ============================================================================

export const clearBasket = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = (req as any).user?.customerId;
    const sessionId = (req as any).session?.id;

    const getCmd = new GetOrCreateBasketCommand(customerId, sessionId);
    const getUc = new GetOrCreateBasketUseCase(BasketRepo);
    const basket = await getUc.execute(getCmd);

    const clrCmd = new ClearBasketCommand(basket.basketId);
    const clrUc = new ClearBasketUseCase(BasketRepo);
    await clrUc.execute(clrCmd);

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true });
    } else {
      res.redirect('/basket?success=' + encodeURIComponent('Cart cleared'));
    }
  } catch (error: any) {
    logger.error('Error:', error);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.redirect('/basket?error=' + encodeURIComponent(error.message || 'Failed to clear cart'));
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

async function calculateBasketTotals(basket: any, user: any) {
  const subtotal = typeof basket.subtotal === 'number'
    ? basket.subtotal
    : (basket.items?.reduce((sum: number, item: any) => sum + (item.lineTotal ?? (item.unitPrice * item.quantity)), 0) || 0);

  // Use a default US address for basket tax calculation (will be recalculated at checkout with actual address)
  const defaultAddress = {
    country: 'US',
    region: '',
    postalCode: '',
    city: ''
  };

  // Calculate tax using the tax service
  const taxCommand = new CalculateOrderTaxCommand(
    basket.items?.map((item: any) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })) || [],
    defaultAddress,
    0, // No shipping in basket view
    user?.customerId
  );

  const taxUseCase = new CalculateOrderTaxUseCase();
  const taxResult = await taxUseCase.execute(taxCommand);

  const total = subtotal + taxResult.taxAmount;

  return {
    subtotal: subtotal.toFixed(2),
    tax: taxResult.taxAmount.toFixed(2),
    total: total.toFixed(2),
    taxRate: taxResult.taxRate
  };
}
