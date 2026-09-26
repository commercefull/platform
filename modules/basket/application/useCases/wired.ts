import basketRepo from '../../infrastructure/repositories/BasketRepository';
import { CouponDiscountQuoteAdapter } from '../../infrastructure/acl/CouponDiscountQuoteAdapter';
import { BasketPricingAdapter } from '../../infrastructure/acl/BasketPricingAdapter';
import { StoreCurrencyAdapter } from '../../infrastructure/acl/StoreCurrencyAdapter';
import { CouponRepository } from '../../../coupon/infrastructure';
import { GetOrCreateBasketUseCase } from './GetOrCreateBasket';
import { AddItemUseCase } from './AddItem';
import { UpdateItemQuantityUseCase } from './UpdateItemQuantity';
import { RemoveItemUseCase } from './RemoveItem';
import { ClearBasketUseCase } from './ClearBasket';
import { ManageAdminBasketUseCase } from './ManageAdminBasket';
import { MergeBasketsUseCase } from './MergeBaskets';
import { AssignBasketToCustomerUseCase } from './AssignBasketToCustomer';
import { MergeGuestBasketOnLoginUseCase } from './MergeGuestBasketOnLogin';
import { SetItemAsGiftUseCase } from './SetItemAsGift';
import { ExtendExpirationUseCase } from './ExtendExpiration';
import { ApplyCouponUseCase } from './ApplyCoupon';
import { ApplyCouponAdminOverrideUseCase, CouponOverrideLookupPort } from './ApplyCouponAdminOverride';
import { RemoveCouponUseCase } from './RemoveCoupon';
import { ProductDetailsAdapter } from '../../infrastructure/acl/ProductDetailsAdapter';

// ACL adapters — wired once, reused by use cases and controllers
const discountQuotePort = new CouponDiscountQuoteAdapter(CouponRepository);
const productPricePort = new BasketPricingAdapter();
const productDetailsPort = new ProductDetailsAdapter();
const storeCurrencyPort = new StoreCurrencyAdapter();

// Admin override coupon lookup — reads active promotion coupons directly
const couponOverrideLookupPort: CouponOverrideLookupPort = {
  findActiveCoupon: async code => {
    const coupon = await CouponRepository.findByCode(code);
    if (!coupon || !coupon.isActive || (coupon.expiresAt && coupon.expiresAt <= new Date())) {
      return null;
    }
    return { type: coupon.type, discountValue: coupon.value };
  },
};

export const getOrCreateBasketUseCase = new GetOrCreateBasketUseCase(basketRepo, storeCurrencyPort);
export const addItemUseCase = new AddItemUseCase(basketRepo, productPricePort);
export const updateItemQuantityUseCase = new UpdateItemQuantityUseCase(basketRepo);
export const removeItemUseCase = new RemoveItemUseCase(basketRepo);
export const clearBasketUseCase = new ClearBasketUseCase(basketRepo);
export const manageAdminBasketUseCase = new ManageAdminBasketUseCase(basketRepo);
export const mergeBasketsUseCase = new MergeBasketsUseCase(basketRepo);
export const assignBasketToCustomerUseCase = new AssignBasketToCustomerUseCase(basketRepo);
export const mergeGuestBasketOnLoginUseCase = new MergeGuestBasketOnLoginUseCase(
  basketRepo,
  mergeBasketsUseCase,
  assignBasketToCustomerUseCase,
);
export const setItemAsGiftUseCase = new SetItemAsGiftUseCase(basketRepo);
export const extendExpirationUseCase = new ExtendExpirationUseCase(basketRepo);
export const applyCouponUseCase = new ApplyCouponUseCase(basketRepo, discountQuotePort);
export const applyCouponAdminOverrideUseCase = new ApplyCouponAdminOverrideUseCase(
  basketRepo,
  discountQuotePort,
  couponOverrideLookupPort,
);
export const removeCouponUseCase = new RemoveCouponUseCase(basketRepo);
export { basketRepo, discountQuotePort, productPricePort, productDetailsPort };
