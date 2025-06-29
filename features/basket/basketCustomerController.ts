import { Response } from 'express';
import { ProductRepo } from '../product/repos/productRepo';
import basketRepo, { Basket } from './basketRepo';
import { storefrontRespond } from '../../libs/templates';

export const addToCart = async (req: any, res: Response): Promise<void> => {
  const productId = req.params.id;
  try {
    // Get the correct basket, either from the db, session, or create a new one
    let basket;

    if (req.user) {
      // Try to find user's basket
      basket = await basketRepo.findUserBasket(req.user._id);
    }

    // If no user basket but session has cart, or no user but session has cart
    if ((req.user && !basket && req.session.cart) || (!req.user && req.session.cart)) {
      basket = req.session.cart;
    } else if (!req.user || !basket) {
      // Create a new basket
      basket = await basketRepo.createBasket(req.user?._id, req.sessionID);
    }

    // Find the product
    const product = await (new ProductRepo()).findById(productId);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/');
    }

    // Add product to basket
    await basketRepo.addItemToBasket(
      basket.id,
      {
        productId: productId,
        variantId: undefined,
        quantity: 1,
        price: product.salePrice || product.basePrice || 0, // Use salePrice if available, otherwise basePrice
        name: product.name,
        sku: product.sku || '',
        imageUrl: product.primaryImageId ? `/product/image/${product.primaryImageId}` : undefined,
        attributes: product.variantAttributes || {}
      }
    );

    // Save updated basket to session
    req.session.cart = await basketRepo.getBasketById(basket.id);

    req.flash('success', 'Item added to the shopping cart');
    res.redirect(req.headers.referer as string);
  } catch (err) {
    console.error('Error adding to cart:', err);
    req.flash('error', 'Failed to add item to cart');
    res.redirect('/');
  }
}

// View shopping cart
export const viewCart = async (req: any, res: Response): Promise<void> => {
  try {
    let basket;

    // Find the basket, whether in session or in db based on the user state
    if (req.user) {
      basket = await basketRepo.findUserBasket(req.user._id);
    }

    // If user is signed in and has basket, load user's basket from the db
    if (req.user && basket) {
      req.session.cart = basket;
      return storefrontRespond(req, res, 'basket/basket', {
        cart: basket,
        pageName: 'Shopping Cart',
        products: await productsFromBasket(basket)
      });
    }

    // If there is no cart in session and user is not logged in, cart is empty
    if (!req.session.cart) {
      return storefrontRespond(req, res, 'basket/basket', {
        cart: null,
        pageName: 'Shopping Cart',
        products: null
      });
    }

    // Otherwise, load the session's cart
    return storefrontRespond(req, res, 'basket/basket', {
      cart: req.session.cart,
      pageName: 'Shopping Cart',
      products: await productsFromBasket(req.session.cart)
    });
  } catch (err) {
    console.error('Error viewing cart:', err);
    req.flash('error', 'Failed to load shopping cart');
    res.redirect('/');
  }
}

// Reduce item quantity
export const reduceItem = async (req: any, res: Response): Promise<void> => {
  const productId = req.params.id;
  try {
    let basketId;

    // Get basket ID
    if (req.user && req.user._id) {
      const userBasket = await basketRepo.findUserBasket(req.user._id);
      if (userBasket) {
        basketId = userBasket.id;
      }
    } else if (req.session.cart) {
      basketId = req.session.cart.id;
    }

    if (!basketId) {
      req.flash('error', 'Cart not found');
      return res.redirect('/');
    }

    // Get current basket
    const basket = await basketRepo.getBasketById(basketId);
    if (!basket) {
      req.flash('error', 'Cart not found');
      return res.redirect('/');
    }

    // Find the item with productId
    const itemIndex = basket.items.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
      const item = basket.items[itemIndex];

      if (item.quantity > 1) {
        // Reduce quantity by 1
        await basketRepo.updateItemQuantity(
          basketId,
          item.id,
          item.quantity - 1
        );
      } else {
        // Remove the item completely
        await basketRepo.removeItemFromBasket(basketId, item.id);
      }

      // If basket is now empty, delete it
      const updatedBasket = await basketRepo.getBasketById(basketId);
      if (updatedBasket && updatedBasket.items.length === 0) {
        await basketRepo.deleteBasketById(basketId);
        req.session.cart = null;
      } else {
        req.session.cart = updatedBasket;
      }
    }

    res.redirect(req.headers.referer as string);
  } catch (err) {
    console.error('Error reducing item:', err);
    req.flash('error', 'Failed to update cart');
    res.redirect('/');
  }
}

// Increase item quantity
export const increaseItem = async (req: any, res: Response): Promise<void> => {
  const productId = req.params.id;
  try {
    let basketId;

    // Get basket ID
    if (req.user && req.user._id) {
      const userBasket = await basketRepo.findUserBasket(req.user._id);
      if (userBasket) {
        basketId = userBasket.id;
      }
    } else if (req.session.cart) {
      basketId = req.session.cart.id;
    }

    if (!basketId) {
      req.flash('error', 'Cart not found');
      return res.redirect('/');
    }

    // Get current basket
    const basket = await basketRepo.getBasketById(basketId);
    if (!basket) {
      req.flash('error', 'Cart not found');
      return res.redirect('/');
    }

    // Find the item in basket
    const item = basket.items.find(item => item.productId === productId);

    if (item) {
      // Increase quantity by 1
      await basketRepo.updateItemQuantity(
        basketId,
        item.id,
        item.quantity + 1
      );

      // Update session cart
      req.session.cart = await basketRepo.getBasketById(basketId);
    }

    res.redirect(req.headers.referer as string);
  } catch (err) {
    console.error('Error increasing item:', err);
    req.flash('error', 'Failed to update cart');
    res.redirect('/');
  }
}

// Remove all items of a particular product
export const removeAllItems = async (req: any, res: Response): Promise<void> => {
  const productId = req.params.id;
  try {
    let basketId;

    // Get basket ID
    if (req.user && req.user._id) {
      const userBasket = await basketRepo.findUserBasket(req.user._id);
      if (userBasket) {
        basketId = userBasket.id;
      }
    } else if (req.session.cart) {
      basketId = req.session.cart.id;
    }

    if (!basketId) {
      req.flash('error', 'Cart not found');
      return res.redirect('/');
    }

    // Get current basket
    const basket = await basketRepo.getBasketById(basketId);
    if (!basket) {
      req.flash('error', 'Cart not found');
      return res.redirect('/');
    }

    // Find all items with productId and remove them
    const items = basket.items.filter(item => item.productId === productId);
    for (const item of items) {
      await basketRepo.removeItemFromBasket(basketId, item.id);
    }

    // If basket is now empty, delete it
    const updatedBasket = await basketRepo.getBasketById(basketId);
    if (updatedBasket && updatedBasket.items.length === 0) {
      await basketRepo.deleteBasketById(basketId);
      req.session.cart = null;
    } else {
      req.session.cart = updatedBasket;
    }

    res.redirect(req.headers.referer as string);
  } catch (err) {
    console.error('Error removing items:', err);
    req.flash('error', 'Failed to update cart');
    res.redirect('/');
  }
}

// View checkout form
export const viewCheckout = async (req: any, res: Response): Promise<void> => {
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }

  try {
    const basketId = req.session.cart.id;
    const basket = await basketRepo.getBasketById(basketId);

    if (!basket) {
      req.flash('error', 'Cart not found');
      return res.redirect('/shopping-cart');
    }

    const errorMsg = req.flash('error')[0];

    storefrontRespond(req, res, 'shop/checkout', {
      total: basket.totalAmount,
      csrfToken: req.csrfToken(),
      errorMsg,
      pageName: 'Checkout'
    });
  } catch (err) {
    console.error('Error loading checkout:', err);
    req.flash('error', 'Failed to load checkout');
    res.redirect('/shopping-cart');
  }
}

// Helper method to get products from basket
const productsFromBasket = async (basket: Basket): Promise<any[]> => {
  const products: Record<string, any>[] = [];

  for (const item of basket.items) {
    try {
      const product = await (new ProductRepo()).findById(item.productId);
      if (product) {
        // Create a new object with product properties and additional basket item properties
        const productObj = {
          ...product,  // Spread all product properties
          qty: item.quantity,
          totalPrice: item.price * item.quantity
        };
        products.push(productObj);
      }
    } catch (err) {
      console.error(`Error loading product ${item.productId}:`, err);
    }
  }

  return products;
}
