import brandRepository from '../../infrastructure/repositories/BrandRepository';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetBrandUseCase, GetBrandInput } from '../../application/useCases/GetBrand';
import { ListBrandsUseCase, ListBrandsInput } from '../../application/useCases/ListBrands';
import { CreateBrandUseCase, CreateBrandInput } from '../../application/useCases/CreateBrand';
import { UpdateBrandUseCase, UpdateBrandInput } from '../../application/useCases/UpdateBrand';
import { DeleteBrandUseCase, DeleteBrandInput } from '../../application/useCases/DeleteBrand';

export const brandResolvers = {
  Query: {
    brand: async (_parent: unknown, args: { brandId?: string; slug?: string }) => {
      const useCase = new GetBrandUseCase(brandRepository);
      const input: GetBrandInput = { brandId: args.brandId, slug: args.slug };
      return useCase.execute(input);
    },

    brands: async (_parent: unknown, args: ListBrandsInput) => {
      const useCase = new ListBrandsUseCase(brandRepository);
      return useCase.execute(args);
    },
  },

  Mutation: {
    createBrand: async (_parent: unknown, args: { input: CreateBrandInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateBrandUseCase(brandRepository);
      return useCase.execute(args.input);
    },

    updateBrand: async (_parent: unknown, args: { input: UpdateBrandInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new UpdateBrandUseCase(brandRepository);
      return useCase.execute(args.input);
    },

    deleteBrand: async (_parent: unknown, args: { brandId: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new DeleteBrandUseCase(brandRepository);
      const input: DeleteBrandInput = { brandId: args.brandId };
      return useCase.execute(input);
    },
  },
};
