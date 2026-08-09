import { PostgreSQLMediaRepository } from '../../infrastructure/repositories/mediaRepo';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { UploadMediaUseCase, UploadMediaInput } from '../../application/useCases/UploadMedia';
import { ListMediaUseCase, ListMediaInput } from '../../application/useCases/ListMedia';
import { DeleteMediaUseCase, DeleteMediaInput } from '../../application/useCases/DeleteMedia';

const mediaRepo = new PostgreSQLMediaRepository();

export const mediaResolvers = {
  Query: {
    media: async (_parent: unknown, args: { input: ListMediaInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListMediaUseCase(mediaRepo as unknown as ConstructorParameters<typeof ListMediaUseCase>[0]);
      return useCase.execute(args.input);
    },
  },

  Mutation: {
    uploadMedia: async (_parent: unknown, args: { input: UploadMediaInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new UploadMediaUseCase(mediaRepo as unknown as ConstructorParameters<typeof UploadMediaUseCase>[0]);
      return useCase.execute(args.input);
    },

    deleteMedia: async (_parent: unknown, args: { mediaId: string; deletedBy?: string; force?: boolean }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new DeleteMediaUseCase(mediaRepo as unknown as ConstructorParameters<typeof DeleteMediaUseCase>[0]);
      const input: DeleteMediaInput = {
        mediaId: args.mediaId,
        deletedBy: args.deletedBy,
        force: args.force,
      };
      return useCase.execute(input);
    },
  },
};
