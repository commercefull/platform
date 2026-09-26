import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { UploadMediaInput } from '../../application/useCases/UploadMedia';
import { ListMediaInput } from '../../application/useCases/ListMedia';
import { DeleteMediaInput } from '../../application/useCases/DeleteMedia';
import { uploadMediaUseCase, listMediaUseCase, deleteMediaUseCase } from '../../application/wired';

export const mediaResolvers = {
  Query: {
    media: async (_parent: unknown, args: { input: ListMediaInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return listMediaUseCase.execute(args.input);
    },
  },

  Mutation: {
    uploadMedia: async (_parent: unknown, args: { input: UploadMediaInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return uploadMediaUseCase.execute(args.input);
    },

    deleteMedia: async (_parent: unknown, args: { mediaId: string; deletedBy?: string; force?: boolean }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const input: DeleteMediaInput = {
        mediaId: args.mediaId,
        deletedBy: args.deletedBy,
        force: args.force,
      };
      return deleteMediaUseCase.execute(input);
    },
  },
};
