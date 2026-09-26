import { GetCustomerCommand } from '../../application/useCases/GetCustomer';
import { RegisterCustomerCommand } from '../../application/useCases/RegisterCustomer';
import { requireCustomerAuth, requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { getCustomerUseCase, registerCustomerUseCase } from '../../application/useCases/wired';

export const customerResolvers = {
  Query: {
    customer: async (
      _parent: unknown,
      args: {
        customerId?: string;
        email?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const command = new GetCustomerCommand(args.customerId, args.email);
      return getCustomerUseCase.execute(command);
    },

    myProfile: async (_parent: unknown, _args: unknown, context: GraphQLAuthContext) => {
      const { customerId } = requireCustomerAuth(context);
      const command = new GetCustomerCommand(customerId);
      return getCustomerUseCase.execute(command);
    },
  },

  Mutation: {
    registerCustomer: async (
      _parent: unknown,
      args: {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        phone?: string;
        dateOfBirth?: string;
        preferredCurrency?: string;
        preferredLanguage?: string;
      },
    ) => {
      const command = new RegisterCustomerCommand(
        args.email,
        args.firstName,
        args.lastName,
        args.password,
        args.phone,
        args.dateOfBirth ? new Date(args.dateOfBirth) : undefined,
        args.preferredCurrency,
        args.preferredLanguage,
      );
      return registerCustomerUseCase.execute(command);
    },
  },
};
