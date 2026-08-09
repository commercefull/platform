import CustomerRepo from '../../infrastructure/repositories/CustomerRepository';
import { GetCustomerUseCase, GetCustomerCommand } from '../../application/useCases/GetCustomer';
import { RegisterCustomerUseCase, RegisterCustomerCommand } from '../../application/useCases/RegisterCustomer';
import { requireCustomerAuth, requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';

export const customerResolvers = {
  Query: {
    customer: async (_parent: unknown, args: {
      customerId?: string;
      email?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetCustomerUseCase(CustomerRepo);
      const command = new GetCustomerCommand(args.customerId, args.email);
      return useCase.execute(command);
    },

    myProfile: async (_parent: unknown, _args: unknown, context: GraphQLAuthContext) => {
      const { customerId } = requireCustomerAuth(context);
      const useCase = new GetCustomerUseCase(CustomerRepo);
      const command = new GetCustomerCommand(customerId);
      return useCase.execute(command);
    },
  },

  Mutation: {
    registerCustomer: async (_parent: unknown, args: {
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      phone?: string;
      dateOfBirth?: string;
      preferredCurrency?: string;
      preferredLanguage?: string;
    }) => {
      const useCase = new RegisterCustomerUseCase(CustomerRepo);
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
      return useCase.execute(command);
    },
  },
};
