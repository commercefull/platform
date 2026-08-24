import storeDataRepository from '../../infrastructure/repositories/StoreDataRepository';

const StoreRepo = storeDataRepository.stores;
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetStoreUseCase, GetStoreQuery } from '../../application/useCases/GetStore';
import { ListStoresUseCase, ListStoresQuery } from '../../application/useCases/ListStores';
import { CreateStoreUseCase, CreateStoreCommand } from '../../application/useCases/CreateStore';
import { OrganizationLookupAdapter } from '../../infrastructure/acl/OrganizationLookupAdapter';
import { SystemConfigAdapter } from '../../infrastructure/acl/SystemConfigAdapter';
import { SystemConfigurationRepo } from '../../../configuration/infrastructure/repositories/SystemConfigurationRepo';

export const storeResolvers = {
  Query: {
    store: async (_parent: unknown, args: {
      storeId?: string;
      slug?: string;
      storeUrl?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetStoreUseCase(StoreRepo);
      const query = new GetStoreQuery(args.storeId, args.slug, args.storeUrl);
      return useCase.execute(query);
    },

    stores: async (_parent: unknown, args: {
      filters?: Record<string, unknown>;
      pagination?: { page?: number; limit?: number };
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListStoresUseCase(StoreRepo);
      const query = new ListStoresQuery(args.filters as ListStoresQuery['filters'], args.pagination);
      return useCase.execute(query);
    },
  },

  Mutation: {
    createStore: async (_parent: unknown, args: { input: Record<string, unknown> }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateStoreUseCase(StoreRepo, new SystemConfigAdapter(new SystemConfigurationRepo()), new OrganizationLookupAdapter());
      const command = new CreateStoreCommand(args.input as CreateStoreCommand['storeData']);
      const result = await useCase.execute(command);
      return {
        storeId: result.storeId,
        name: result.name,
        slug: result.slug,
        storeType: result.storeType,
      };
    },
  },
};
