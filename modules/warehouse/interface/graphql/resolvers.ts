import WarehouseRepo from '../../infrastructure/repositories/warehouseRepo';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetWarehouseUseCase, GetWarehouseInput } from '../../application/useCases/GetWarehouse';
import { ListWarehousesUseCase, ListWarehousesInput } from '../../application/useCases/ListWarehouses';
import { CreateWarehouseUseCase, CreateWarehouseInput } from '../../application/useCases/CreateWarehouse';

export const warehouseResolvers = {
  Query: {
    warehouse: async (_parent: unknown, args: { input: GetWarehouseInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetWarehouseUseCase(WarehouseRepo);
      return useCase.execute(args.input);
    },

    warehouses: async (_parent: unknown, args: { input?: ListWarehousesInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListWarehousesUseCase(WarehouseRepo);
      return useCase.execute(args.input || {});
    },
  },

  Mutation: {
    createWarehouse: async (_parent: unknown, args: { input: CreateWarehouseInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateWarehouseUseCase(WarehouseRepo);
      const result = await useCase.execute(args.input);
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
