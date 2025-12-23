import { BaseNotification, NotificationBuilder, NotificationChannel, NotificationType } from './notification';

/**
 * Parameters for abandoned cart notification
 */
export interface AbandonedCartParams {
  firstName: string;
  cartItems: Array<{
    productName: string;
    quantity: number;
    price: string;
    imageUrl?: string;
  }>;
  cartTotal: string;
  currency?: string;
  cartRecoveryUrl: string;
  discountCode?: string;
  discountAmount?: string;
}

/**
 * Abandoned cart notification
 */
export class AbandonedCartNotification extends NotificationBuilder<AbandonedCartParams> {
  private params: AbandonedCartParams;

  constructor(userId: string, params: AbandonedCartParams, channels: NotificationChannel[] = ['email']) {
    super(userId, 'customer', channels);
    this.type = 'abandoned_cart';
    this.params = params;
  }

  buildTitle(): string {
    return 'Your Shopping Cart is Waiting!';
  }

  buildContent(): string {
    let content = `Hi ${this.params.firstName},\n\n`;
    content += "We noticed you left some items in your shopping cart. Don't worry, we've saved them for you!\n\n";

    content += "Here's what you left in your cart:\n";
    this.params.cartItems.forEach(item => {
      content += `- ${item.productName} (Qty: ${item.quantity}) - ${this.params.currency || '$'}${item.price}\n`;
    });

    content += `\nCart Total: ${this.params.currency || '$'}${this.params.cartTotal}\n\n`;

    if (this.params.discountCode) {
      content += `Special offer just for you! Use code ${this.params.discountCode} at checkout`;
      if (this.params.discountAmount) {
        content += ` to get ${this.params.discountAmount} off your purchase`;
      }
      content += '.\n\n';
    }

    content += `Ready to complete your purchase? Click here to recover your cart: ${this.params.cartRecoveryUrl}\n\n`;
    content += 'If you have any questions or need assistance, our customer service team is always here to help.\n\n';
    content += 'Happy shopping!\nThe Team';

    return content;
  }

  getMetadata(): Record<string, unknown> {
    return {
      cartItemCount: this.params.cartItems.length,
      cartTotal: this.params.cartTotal,
      discountCode: this.params.discountCode,
      discountAmount: this.params.discountAmount,
      cartRecoveryUrl: this.params.cartRecoveryUrl,
    };
  }
}

/**
 * Parameters for price drop notification
 */
export interface PriceDropParams {
  firstName: string;
  productName: string;
  originalPrice: string;
  newPrice: string;
  savingsAmount: string;
  savingsPercentage: string;
  currency?: string;
  productImageUrl?: string;
  productUrl: string;
}

/**
 * Price drop notification
 */
export class PriceDropNotification extends NotificationBuilder<PriceDropParams> {
  private params: PriceDropParams;

  constructor(userId: string, params: PriceDropParams, channels: NotificationChannel[] = ['email', 'push']) {
    super(userId, 'customer', channels);
    this.type = 'price_drop';
    this.params = params;
  }

  buildTitle(): string {
    return `Price Drop Alert: ${this.params.productName}`;
  }

  buildContent(): string {
    let content = `Hello ${this.params.firstName},\n\n`;
    content += `Great news! The price of ${this.params.productName} that you've been interested in has dropped.\n\n`;
    content += `Original Price: ${this.params.currency || '$'}${this.params.originalPrice}\n`;
    content += `New Price: ${this.params.currency || '$'}${this.params.newPrice}\n`;
    content += `You Save: ${this.params.currency || '$'}${this.params.savingsAmount} (${this.params.savingsPercentage}%)\n\n`;
    content += `Don't miss out on this limited-time offer! Click here to view the product: ${this.params.productUrl}\n\n`;
    content += 'Happy shopping!\nThe Team';

    return content;
  }

  getMetadata(): Record<string, unknown> {
    return {
      productName: this.params.productName,
      originalPrice: this.params.originalPrice,
      newPrice: this.params.newPrice,
      savingsAmount: this.params.savingsAmount,
      savingsPercentage: this.params.savingsPercentage,
      productImageUrl: this.params.productImageUrl,
      productUrl: this.params.productUrl,
    };
  }
}

/**
 * Parameters for back in stock notification
 */
export interface BackInStockParams {
  firstName: string;
  productName: string;
  productPrice: string;
  currency?: string;
  productImageUrl?: string;
  productUrl: string;
  limitedQuantity?: boolean;
}

/**
 * Back in stock notification
 */
export class BackInStockNotification extends NotificationBuilder<BackInStockParams> {
  private params: BackInStockParams;

  constructor(userId: string, params: BackInStockParams, channels: NotificationChannel[] = ['email', 'push']) {
    super(userId, 'customer', channels);
    this.type = 'back_in_stock';
    this.params = params;
  }

  buildTitle(): string {
    return `${this.params.productName} is Back in Stock!`;
  }

  buildContent(): string {
    let content = `Hi ${this.params.firstName},\n\n`;
    content += `Good news! The ${this.params.productName} you wanted is back in stock.\n\n`;
    content += `Price: ${this.params.currency || '$'}${this.params.productPrice}\n\n`;

    if (this.params.limitedQuantity) {
      content += 'Please note that quantities are limited and this popular item may sell out quickly.\n\n';
    }

    content += `Click here to view the product: ${this.params.productUrl}\n\n`;
    content += 'Happy shopping!\nThe Team';

    return content;
  }

  getMetadata(): Record<string, unknown> {
    return {
      productName: this.params.productName,
      productPrice: this.params.productPrice,
      productImageUrl: this.params.productImageUrl,
      productUrl: this.params.productUrl,
      limitedQuantity: this.params.limitedQuantity,
    };
  }
}

/**
 * Parameters for coupon notification
 */
export interface CouponOfferParams {
  firstName: string;
  couponCode: string;
  discountAmount: string;
  minimumPurchase?: string;
  expiryDate: string;
  categoryRestriction?: string;
  productImageUrl?: string;
  shopUrl: string;
}

/**
 * Coupon offer notification
 */
export class CouponOfferNotification extends NotificationBuilder<CouponOfferParams> {
  private params: CouponOfferParams;

  constructor(userId: string, params: CouponOfferParams, channels: NotificationChannel[] = ['email', 'push', 'in_app']) {
    super(userId, 'customer', channels);
    this.type = 'coupon_offer';
    this.params = params;
  }

  buildTitle(): string {
    return `Special Offer: ${this.params.discountAmount} Off Your Next Purchase!`;
  }

  buildContent(): string {
    let content = `Hello ${this.params.firstName},\n\n`;
    content += `We'd like to offer you a special discount of ${this.params.discountAmount} on your next purchase.\n\n`;
    content += `Use Coupon Code: ${this.params.couponCode}\n`;

    if (this.params.minimumPurchase) {
      content += `Minimum Purchase: ${this.params.minimumPurchase}\n`;
    }

    if (this.params.categoryRestriction) {
      content += `Valid for: ${this.params.categoryRestriction}\n`;
    }

    content += `Expires On: ${this.params.expiryDate}\n\n`;
    content += `Ready to shop? Click here: ${this.params.shopUrl}\n\n`;
    content += 'Happy shopping!\nThe Team';

    return content;
  }

  getMetadata(): Record<string, unknown> {
    return {
      couponCode: this.params.couponCode,
      discountAmount: this.params.discountAmount,
      minimumPurchase: this.params.minimumPurchase,
      expiryDate: this.params.expiryDate,
      categoryRestriction: this.params.categoryRestriction,
      shopUrl: this.params.shopUrl,
    };
  }
}

/**
 * Parameters for new product notification
 */
export interface NewProductParams {
  firstName: string;
  productName: string;
  productDescription: string;
  productPrice: string;
  currency?: string;
  productImageUrl?: string;
  productUrl: string;
  category: string;
}

/**
 * New product notification
 */
export class NewProductNotification extends NotificationBuilder<NewProductParams> {
  private params: NewProductParams;

  constructor(userId: string, params: NewProductParams, channels: NotificationChannel[] = ['email']) {
    super(userId, 'customer', channels);
    this.type = 'new_product';
    this.params = params;
  }

  buildTitle(): string {
    return `New Arrival: Introducing ${this.params.productName}`;
  }

  buildContent(): string {
    let content = `Dear ${this.params.firstName},\n\n`;
    content += `We're excited to introduce a new product in our ${this.params.category} collection.\n\n`;
    content += `Product: ${this.params.productName}\n`;
    content += `Price: ${this.params.currency || '$'}${this.params.productPrice}\n\n`;
    content += `Description: ${this.params.productDescription}\n\n`;
    content += `Be among the first to check it out: ${this.params.productUrl}\n\n`;
    content += 'Thank you for your continued support!\n';
    content += 'The Team';

    return content;
  }

  getMetadata(): Record<string, unknown> {
    return {
      productName: this.params.productName,
      productPrice: this.params.productPrice,
      category: this.params.category,
      productImageUrl: this.params.productImageUrl,
      productUrl: this.params.productUrl,
    };
  }
}
