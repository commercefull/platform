import {
  GetOrCreateBasketCommand,
  AddItemCommand,
  UpdateItemQuantityCommand,
  RemoveItemCommand,
  ClearBasketCommand,
} from '../../application/useCases';
import {
  getOrCreateBasketUseCase,
  addItemUseCase,
  updateItemQuantityUseCase,
  removeItemUseCase,
  clearBasketUseCase,
} from '../../application/useCases/wired';
import { requireAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';

export const basketResolvers = {
  Query: {
    myBasket: async (
      _parent: unknown,
      args: {
        currency?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      const user = requireAuth(context);
      const command = new GetOrCreateBasketCommand(user.customerId || user._id, context.sessionId, args.currency ?? 'USD');
      return getOrCreateBasketUseCase.execute(command);
    },
  },

  Mutation: {
    addItemToBasket: async (
      _parent: unknown,
      args: {
        basketId: string;
        productId: string;
        sku: string;
        name: string;
        quantity: number;
        unitPrice: number;
        productVariantId?: string;
        imageUrl?: string;
        itemType?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
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
      return addItemUseCase.execute(command);
    },

    updateBasketItemQuantity: async (
      _parent: unknown,
      args: {
        basketId: string;
        basketItemId: string;
        quantity: number;
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
      const command = new UpdateItemQuantityCommand(args.basketId, args.basketItemId, args.quantity);
      return updateItemQuantityUseCase.execute(command);
    },

    removeBasketItem: async (
      _parent: unknown,
      args: {
        basketId: string;
        basketItemId: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
      const command = new RemoveItemCommand(args.basketId, args.basketItemId);
      return removeItemUseCase.execute(command);
    },

    clearBasket: async (_parent: unknown, args: { basketId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const command = new ClearBasketCommand(args.basketId);
      return clearBasketUseCase.execute(command);
    },
  },
};
