import { Basket } from './Basket';
import { BasketItem } from './BasketItem';
import { Money } from '../valueObjects/Money';
import {
  BasketItemNotFoundError,
  BasketNotActiveError,
  BasketAlreadyAssignedError,
  CouponAlreadyAppliedError,
  NoCouponAppliedError,
  BasketValidationError,
} from '../errors/BasketErrors';

describe('Basket', () => {
  let basket: Basket;
  let item: BasketItem;

  beforeEach(() => {
    basket = Basket.create({ basketId: 'b1', customerId: 'c1' });
    item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 2, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
  });

  it('should create a basket (happy path)', () => {
    expect(basket.basketId).toBe('b1');
    expect(basket.status).toBe('active');
    expect(basket.isActive).toBe(true);
    expect(basket.isEmpty).toBe(true);
    expect(basket.currency).toBe('USD');
  });

  it('should add an item', () => {
    basket.addItem(item);
    expect(basket.itemCount).toBe(2);
    expect(basket.uniqueItemCount).toBe(1);
    expect(basket.isEmpty).toBe(false);
  });

  it('should merge same-product items', () => {
    basket.addItem(item);
    const item2 = BasketItem.create({
      basketItemId: 'i2', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 3, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    basket.addItem(item2);
    expect(basket.uniqueItemCount).toBe(1);
    expect(basket.itemCount).toBe(5);
  });

  it('should update item quantity', () => {
    basket.addItem(item);
    basket.updateItemQuantity('i1', 5);
    expect(basket.itemCount).toBe(5);
  });

  it('should throw on update non-existent item', () => {
    expect(() => basket.updateItemQuantity('nonexistent', 5)).toThrow(BasketItemNotFoundError);
  });

  it('should remove an item', () => {
    basket.addItem(item);
    basket.removeItem('i1');
    expect(basket.isEmpty).toBe(true);
  });

  it('should throw on remove non-existent item', () => {
    expect(() => basket.removeItem('nonexistent')).toThrow(BasketItemNotFoundError);
  });

  it('should clear all items', () => {
    basket.addItem(item);
    basket.clearItems();
    expect(basket.isEmpty).toBe(true);
  });

  it('should calculate subtotal and total', () => {
    basket.addItem(item);
    expect(basket.subtotal.amount).toBe(100);
    expect(basket.total.amount).toBe(100);
  });

  it('should apply percentage coupon', () => {
    basket.addItem(item);
    basket.applyCoupon('SAVE10', 'percentage', 10);
    expect(basket.coupon?.couponCode).toBe('SAVE10');
    expect(basket.discountAmount).toBe(10);
    expect(basket.total.amount).toBe(90);
  });

  it('should apply fixed coupon', () => {
    basket.addItem(item);
    basket.applyCoupon('SAVE20', 'fixed', 20);
    expect(basket.discountAmount).toBe(20);
    expect(basket.total.amount).toBe(80);
  });

  it('should throw on apply coupon when one already applied', () => {
    basket.addItem(item);
    basket.applyCoupon('SAVE10', 'percentage', 10);
    expect(() => basket.applyCoupon('SAVE20', 'percentage', 20)).toThrow(CouponAlreadyAppliedError);
  });

  it('should throw on apply coupon with zero/negative value', () => {
    basket.addItem(item);
    expect(() => basket.applyCoupon('BAD', 'percentage', 0)).toThrow(BasketValidationError);
  });

  it('should remove coupon', () => {
    basket.addItem(item);
    basket.applyCoupon('SAVE10', 'percentage', 10);
    basket.removeCoupon();
    expect(basket.coupon).toBeUndefined();
    expect(basket.discountAmount).toBe(0);
  });

  it('should throw on remove coupon when none applied', () => {
    expect(() => basket.removeCoupon()).toThrow(NoCouponAppliedError);
  });

  it('should assign to customer', () => {
    const guestBasket = Basket.create({ basketId: 'b2', sessionId: 's1' });
    guestBasket.assignToCustomer('c1');
    expect(guestBasket.customerId).toBe('c1');
    expect(guestBasket.sessionId).toBeUndefined();
  });

  it('should throw on reassign to different customer', () => {
    expect(() => basket.assignToCustomer('c2')).toThrow(BasketAlreadyAssignedError);
  });

  it('should merge from another basket', () => {
    const other = Basket.create({ basketId: 'b2' });
    other.addItem(item);
    basket.mergeFrom(other);
    expect(basket.itemCount).toBe(2);
  });

  it('should mark as abandoned', () => {
    basket.markAsAbandoned();
    expect(basket.status).toBe('abandoned');
  });

  it('should mark as completed', () => {
    basket.markAsCompleted('o1');
    expect(basket.status).toBe('completed');
    expect(basket.convertedToOrderId).toBe('o1');
  });

  it('should throw on modify non-active basket', () => {
    basket.markAsAbandoned();
    expect(() => basket.addItem(item)).toThrow(BasketNotActiveError);
  });

  it('should set item as gift', () => {
    basket.addItem(item);
    basket.setItemAsGift('i1', 'Happy Birthday!');
    const item2 = basket.findItem('i1');
    expect(item2?.isGift).toBe(true);
    expect(item2?.giftMessage).toBe('Happy Birthday!');
  });

  it('should extend expiration', () => {
    basket.extendExpiration(14);
    expect(basket.expiresAt).toBeDefined();
  });

  it('should update metadata', () => {
    basket.updateMetadata({ key: 'value' });
    expect(basket.metadata?.key).toBe('value');
  });

  it('should serialize to JSON', () => {
    basket.addItem(item);
    const json = basket.toJSON();
    expect(json.basketId).toBe('b1');
    expect(json.itemCount).toBe(2);
    expect(json.subtotal).toBe(100);
  });
});

describe('BasketItem', () => {
  it('should create an item (happy path)', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 2, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    expect(item.basketItemId).toBe('i1');
    expect(item.quantity).toBe(2);
    expect(item.lineTotal.amount).toBe(100);
  });

  it('should update quantity', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 2, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    item.updateQuantity(5);
    expect(item.quantity).toBe(5);
  });

  it('should throw on quantity < 1', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 2, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    expect(() => item.updateQuantity(0)).toThrow();
  });

  it('should throw on quantity > 100', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 2, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    expect(() => item.updateQuantity(101)).toThrow();
  });

  it('should increment and decrement quantity', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 5, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    item.incrementQuantity(3);
    expect(item.quantity).toBe(8);
    item.decrementQuantity(2);
    expect(item.quantity).toBe(6);
  });

  it('should set and remove gift status', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 1, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    item.setAsGift('Hello!');
    expect(item.isGift).toBe(true);
    expect(item.giftMessage).toBe('Hello!');
    item.removeGiftStatus();
    expect(item.isGift).toBe(false);
    expect(item.giftMessage).toBeUndefined();
  });

  it('should set discount amount', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 2, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    item.setDiscountAmount(20);
    expect(item.discountAmount).toBe(20);
    expect(item.lineTotal.amount).toBe(80);
  });

  it('should throw on negative discount', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 1, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    expect(() => item.setDiscountAmount(-5)).toThrow();
  });

  it('should check same product', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', productVariantId: 'v1',
      sku: 'SKU1', name: 'Widget', quantity: 1, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    expect(item.isSameProduct('p1', 'v1')).toBe(true);
    expect(item.isSameProduct('p1', 'v2')).toBe(false);
    expect(item.isSameProduct('p2')).toBe(false);
  });

  it('should detect digital type', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Ebook', quantity: 1, unitPrice: Money.create(10, 'USD'),
      itemType: 'digital', isGift: false,
    });
    expect(item.isDigital).toBe(true);
  });

  it('should serialize to JSON', () => {
    const item = BasketItem.create({
      basketItemId: 'i1', basketId: 'b1', productId: 'p1', sku: 'SKU1',
      name: 'Widget', quantity: 2, unitPrice: Money.create(50, 'USD'),
      itemType: 'physical', isGift: false,
    });
    const json = item.toJSON();
    expect(json.basketItemId).toBe('i1');
    expect(json.lineTotal).toBe(100);
  });
});
