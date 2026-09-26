import { requireAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { LoginCommand } from '../../application/useCases/Login';
import { RefreshTokenCommand } from '../../application/useCases/RefreshToken';
import { LogoutCommand } from '../../application/useCases/Logout';
import { loginUseCase, logoutUseCase, refreshTokenUseCase } from '../../application/wired';

export const identityResolvers = {
  Query: {
    refreshToken: async (_parent: unknown, args: { input: { refreshToken: string } }) => {
      const command = new RefreshTokenCommand(args.input.refreshToken);
      return refreshTokenUseCase.execute(command);
    },
  },

  Mutation: {
    login: async (_parent: unknown, args: { input: { email: string; password: string; ip?: string } }) => {
      const command = new LoginCommand(args.input.email, args.input.password, args.input.ip);
      return loginUseCase.execute(command);
    },

    logout: async (_parent: unknown, args: { userId: string }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const command = new LogoutCommand(args.userId);
      await logoutUseCase.execute(command);
      return true;
    },
  },
};
