import basketRepo from '../../infrastructure/repositories/BasketRepository';
import { GetOrCreateBasketUseCase } from './GetOrCreateBasket';
import { AddItemUseCase } from './AddItem';
import { UpdateItemQuantityUseCase } from './UpdateItemQuantity';
import { RemoveItemUseCase } from './RemoveItem';
import { ClearBasketUseCase } from './ClearBasket';
import { ManageAdminBasketUseCase } from './ManageAdminBasket';

export const getOrCreateBasketUseCase = new GetOrCreateBasketUseCase(basketRepo);
export const addItemUseCase = new AddItemUseCase(basketRepo);
export const updateItemQuantityUseCase = new UpdateItemQuantityUseCase(basketRepo);
export const removeItemUseCase = new RemoveItemUseCase(basketRepo);
export const clearBasketUseCase = new ClearBasketUseCase(basketRepo);
export const manageAdminBasketUseCase = new ManageAdminBasketUseCase(basketRepo);
