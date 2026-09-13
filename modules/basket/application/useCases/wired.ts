import basketRepo from '../../infrastructure/repositories/BasketRepository';
import { CouponDiscountQuoteAdapter } from '../../infrastructure/acl/CouponDiscountQuoteAdapter';
import { CouponRepository } from '../../../coupon/infrastructure';
import { GetOrCreateBasketUseCase } from './GetOrCreateBasket';
import { AddItemUseCase } from './AddItem';
import { UpdateItemQuantityUseCase } from './UpdateItemQuantity';
import { RemoveItemUseCase } from './RemoveItem';
import { ClearBasketUseCase } from './ClearBasket';
import { ManageAdminBasketUseCase } from './ManageAdminBasket';
import { MergeBasketsUseCase } from './MergeBaskets';
import { AssignBasketToCustomerUseCase } from './AssignBasketToCustomer';
import { SetItemAsGiftUseCase } from './SetItemAsGift';
import { ExtendExpirationUseCase } from './ExtendExpiration';
import { ApplyCouponUseCase } from './ApplyCoupon';
import { RemoveCouponUseCase } from './RemoveCoupon';

// ACL adapter — wired once, reused by use cases and controllers
const discountQuotePort = new CouponDiscountQuoteAdapter(CouponRepository);

export const getOrCreateBasketUseCase = new GetOrCreateBasketUseCase(basketRepo);
export const addItemUseCase = new AddItemUseCase(basketRepo);
export const updateItemQuantityUseCase = new UpdateItemQuantityUseCase(basketRepo);
export const removeItemUseCase = new RemoveItemUseCase(basketRepo);
export const clearBasketUseCase = new ClearBasketUseCase(basketRepo);
export const manageAdminBasketUseCase = new ManageAdminBasketUseCase(basketRepo);
export const mergeBasketsUseCase = new MergeBasketsUseCase(basketRepo);
export const assignBasketToCustomerUseCase = new AssignBasketToCustomerUseCase(basketRepo);
export const setItemAsGiftUseCase = new SetItemAsGiftUseCase(basketRepo);
export const extendExpirationUseCase = new ExtendExpirationUseCase(basketRepo);
export const applyCouponUseCase = new ApplyCouponUseCase(basketRepo, discountQuotePort);
export const removeCouponUseCase = new RemoveCouponUseCase(basketRepo);
export { basketRepo, discountQuotePort };
