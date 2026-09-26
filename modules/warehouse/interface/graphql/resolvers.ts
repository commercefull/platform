import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetWarehouseInput } from '../../application/useCases/GetWarehouse';
import { ListWarehousesInput } from '../../application/useCases/ListWarehouses';
import { CreateWarehouseInput } from '../../application/useCases/CreateWarehouse';
import { createWarehouseUseCase, getWarehouseUseCase, listWarehousesUseCase } from '../../application/wired';

export const warehouseResolvers = {
  Query: {
    warehouse: async (_parent: unknown, args: { input: GetWarehouseInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return getWarehouseUseCase.execute(args.input);
    },

    warehouses: async (_parent: unknown, args: { input?: ListWarehousesInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return listWarehousesUseCase.execute(args.input || {});
    },
  },

  Mutation: {
    createWarehouse: async (_parent: unknown, args: { input: CreateWarehouseInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const result = await createWarehouseUseCase.execute(args.input);
      return {
        warehouseId: result.warehouseId,
        name: result.name,
        code: result.code,
        type: result.type,
        isActive: result.isActive,
        createdAt: result.createdAt,
      };
    },
  },
};
