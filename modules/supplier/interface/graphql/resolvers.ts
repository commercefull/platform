import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreateSupplierInput } from '../../application/useCases/CreateSupplier';
import { CreatePurchaseOrderInput } from '../../application/useCases/CreatePurchaseOrder';
import { ReceiveGoodsInput } from '../../application/useCases/ReceiveGoods';
import {
  createPurchaseOrderUseCase,
  createSupplierUseCase,
  receiveGoodsUseCase,
} from '../../application/wired';

export const supplierResolvers = {
  Mutation: {
    createSupplier: async (_parent: unknown, args: { input: CreateSupplierInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return createSupplierUseCase.execute(args.input);
    },

    createPurchaseOrder: async (_parent: unknown, args: { input: CreatePurchaseOrderInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const input: CreatePurchaseOrderInput = {
        ...args.input,
        expectedDeliveryDate: args.input.expectedDeliveryDate ? new Date(args.input.expectedDeliveryDate) : undefined,
      };
      return createPurchaseOrderUseCase.execute(input);
    },

    receiveGoods: async (_parent: unknown, args: { input: ReceiveGoodsInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return receiveGoodsUseCase.execute(args.input);
    },
  },
};
