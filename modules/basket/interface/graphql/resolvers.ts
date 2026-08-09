import BasketRepo from '../../infrastructure/repositories/BasketRepository';
import { GetOrCreateBasketUseCase, GetOrCreateBasketCommand } from '../../application/useCases/GetOrCreateBasket';
import { AddItemUseCase, AddItemCommand } from '../../application/useCases/AddItem';
import { UpdateItemQuantityUseCase, UpdateItemQuantityCommand } from '../../application/useCases/UpdateItemQuantity';
import { RemoveItemUseCase, RemoveItemCommand } from '../../application/useCases/RemoveItem';
import { ClearBasketUseCase, ClearBasketCommand } from '../../application/useCases/ClearBasket';
import { requireAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';

export const basketResolvers = {
  Query: {
    myBasket: async (_parent: unknown, args: {
      currency?: string;
    }, context: GraphQLAuthContext) => {
      const user = requireAuth(context);
      const useCase = new GetOrCreateBasketUseCase(BasketRepo);
      const command = new GetOrCreateBasketCommand(
        user.customerId || user._id,
        context.sessionId,
        args.currency ?? 'USD',
      );
      return useCase.execute(command);
    },
  },

  Mutation: {
    addItemToBasket: async (_parent: unknown, args: {
      basketId: string;
      productId: string;
      sku: string;
      name: string;
      quantity: number;
      unitPrice: number;
      productVariantId?: string;
      imageUrl?: string;
      itemType?: string;
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = new AddItemUseCase(BasketRepo);
      const command = new AddItemCommand(
        args.basketId,
        args.productId,
        args.sku,
        args.name,
        args.quantity,
        args.unitPrice,
        args.productVariantId,
        args.imageUrl,
        undefined,
        (args.itemType as 'physical' | 'digital' | 'subscription' | 'service') ?? 'physical',
      );
      return useCase.execute(command);
    },

    updateBasketItemQuantity: async (_parent: unknown, args: {
      basketId: string;
      basketItemId: string;
      quantity: number;
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = new UpdateItemQuantityUseCase(BasketRepo);
      const command = new UpdateItemQuantityCommand(
        args.basketId,
        args.basketItemId,
        args.quantity,
      );
      return useCase.execute(command);
    },

    removeBasketItem: async (_parent: unknown, args: {
      basketId: string;
      basketItemId: string;
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = new RemoveItemUseCase(BasketRepo);
      const command = new RemoveItemCommand(args.basketId, args.basketItemId);
      return useCase.execute(command);
    },

    clearBasket: async (_parent: unknown, args: { basketId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = new ClearBasketUseCase(BasketRepo);
      const command = new ClearBasketCommand(args.basketId);
      return useCase.execute(command);
    },
  },
};
