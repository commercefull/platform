import identityDataRepository from '../../infrastructure/repositories/IdentityDataRepository';

const identityRepo = identityDataRepository.users;
import { requireAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { LoginUseCase, LoginCommand, RefreshTokenUseCase, RefreshTokenCommand, LogoutUseCase, LogoutCommand } from '../../application/useCases/Authenticate';

export const identityResolvers = {
  Query: {
    refreshToken: async (_parent: unknown, args: { input: { refreshToken: string } }) => {
      const useCase = new RefreshTokenUseCase(identityRepo as never);
      const command = new RefreshTokenCommand(args.input.refreshToken);
      return useCase.execute(command);
    },
  },

  Mutation: {
    login: async (_parent: unknown, args: { input: { email: string; password: string; ip?: string } }) => {
      const useCase = new LoginUseCase(identityRepo as never);
      const command = new LoginCommand(args.input.email, args.input.password, args.input.ip);
      return useCase.execute(command);
    },

    logout: async (_parent: unknown, args: { userId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = new LogoutUseCase(identityRepo as never);
      const command = new LogoutCommand(args.userId);
      await useCase.execute(command);
      return true;
    },
  },
};
