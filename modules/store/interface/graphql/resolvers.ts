import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetStoreQuery } from '../../application/useCases/GetStore';
import { ListStoresQuery } from '../../application/useCases/ListStores';
import { CreateStoreCommand } from '../../application/useCases/CreateStore';
import { createStoreUseCase, getStoreUseCase, listStoresUseCase } from '../../application/useCases/wired';

export const storeResolvers = {
  Query: {
    store: async (
      _parent: unknown,
      args: {
        storeId?: string;
        slug?: string;
        storeUrl?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const query = new GetStoreQuery(args.storeId, args.slug, args.storeUrl);
      return getStoreUseCase.execute(query);
    },

    stores: async (
      _parent: unknown,
      args: {
        filters?: Record<string, unknown>;
        pagination?: { page?: number; limit?: number };
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const query = new ListStoresQuery(args.filters as ListStoresQuery['filters'], args.pagination);
      return listStoresUseCase.execute(query);
    },
  },

  Mutation: {
    createStore: async (_parent: unknown, args: { input: Record<string, unknown> }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const command = new CreateStoreCommand(args.input as CreateStoreCommand['storeData']);
      const result = await createStoreUseCase.execute(command);
      return {
        storeId: result.storeId,
        name: result.name,
        slug: result.slug,
        storeType: result.storeType,
      };
    },
  },
};
