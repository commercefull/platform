/**
 * Basket Pricing Extension
 * 
 * Extends the basket repository with pricing functionality
 */
import BasketRepo, { Basket } from './basketRepo';
import { calculateBasketPrices } from '../pricing/hooks/pricingHooks';

// Original methods that need to be wrapped to apply pricing
const originalAddItemToBasket = BasketRepo.addItemToBasket;
const originalUpdateItemQuantity = BasketRepo.updateItemQuantity;
const originalGetBasketById = BasketRepo.getBasketById;
const originalGetCustomerBasket = BasketRepo.getCustomerBasket;
const originalGetSessionBasket = BasketRepo.getSessionBasket;
const originalMergeBaskets = BasketRepo.mergeBaskets;

// Wrap the addItemToBasket method to apply pricing after adding an item
BasketRepo.addItemToBasket = async function(...args) {
  // First, call original method
  const result = await originalAddItemToBasket.apply(this, args);
  
  // Then get the updated basket
  const basketId = args[0];
  let basket = await originalGetBasketById.call(this, basketId);
  
  // Apply pricing calculations
  if (basket) {
    // Calculate prices but don't persist to DB
    // The prices will be calculated on next retrieval
    await calculateBasketPrices(basket);
  }
  
  return result;
};

// Wrap the updateItemQuantity method to apply pricing after updating quantity
BasketRepo.updateItemQuantity = async function(...args) {
  // First, call original method
  const result = await originalUpdateItemQuantity.apply(this, args);
  
  // Then get the updated basket
  const basketId = args[0];
  let basket = await originalGetBasketById.call(this, basketId);
  
  // Apply pricing calculations
  if (basket) {
    // Calculate prices but don't persist to DB
    // The prices will be calculated on next retrieval
    await calculateBasketPrices(basket);
  }
  
  return result;
};

// Wrap the getBasketById method to apply pricing when retrieving a basket
BasketRepo.getBasketById = async function(basketId: string): Promise<Basket | null> {
  // First, call original method
  const basket = await originalGetBasketById.call(this, basketId);
  
  // Apply pricing calculations if basket exists
  if (basket) {
    const updatedBasket = await calculateBasketPrices(basket);
    return updatedBasket;
  }
  
  return basket;
};

// Wrap the getCustomerBasket method to apply pricing when retrieving a customer's basket
BasketRepo.getCustomerBasket = async function(customerId: string): Promise<Basket | null> {
  // First, call original method
  const basket = await originalGetCustomerBasket.call(this, customerId);
  
  // Apply pricing calculations if basket exists
  if (basket) {
    const updatedBasket = await calculateBasketPrices(basket, {
      // Apply membership benefits for logged-in customers
      applyMembershipBenefits: true
    });
    return updatedBasket;
  }
  
  return basket;
};

// Wrap the getSessionBasket method to apply pricing when retrieving a session basket
BasketRepo.getSessionBasket = async function(sessionId: string): Promise<Basket | null> {
  // First, call original method
  const basket = await originalGetSessionBasket.call(this, sessionId);
  
  // Apply pricing calculations if basket exists
  if (basket) {
    const updatedBasket = await calculateBasketPrices(basket);
    return updatedBasket;
  }
  
  return basket;
};

// Wrap the mergeBaskets method to apply pricing after merging
BasketRepo.mergeBaskets = async function(customerBasketId: string, sessionBasketId: string): Promise<Basket | null> {
  // First, call original method
  const basket = await originalMergeBaskets.call(this, customerBasketId, sessionBasketId);
  
  // Apply pricing calculations if basket exists
  if (basket) {
    const updatedBasket = await calculateBasketPrices(basket, {
      // Apply membership benefits for logged-in customers
      applyMembershipBenefits: true
    });
    
    return updatedBasket;
  }
  
  return basket;
};

export default BasketRepo;
