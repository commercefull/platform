import OrderRepo from '../../infrastructure/repositories/OrderRepository';
import { GetOrderUseCase, GetOrderCommand } from '../../application/useCases/GetOrder';
import { GetCustomerOrdersUseCase, GetCustomerOrdersCommand } from '../../application/useCases/GetCustomerOrders';
import { ListOrdersUseCase, ListOrdersCommand } from '../../application/useCases/ListOrders';
import { requireCustomerAuth, requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';

export const orderResolvers = {
  Query: {
    order: async (_parent: unknown, args: {
      orderId?: string;
      orderNumber?: string;
    }, context: GraphQLAuthContext) => {
      const { customerId } = requireCustomerAuth(context);
      const useCase = new GetOrderUseCase(OrderRepo);
      const command = new GetOrderCommand(
        args.orderId,
        args.orderNumber,
        customerId,
      );
      return useCase.execute(command);
    },

    myOrders: async (_parent: unknown, args: {
      customerId: string;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    }, context: GraphQLAuthContext) => {
      const { customerId } = requireCustomerAuth(context);
      const useCase = new GetCustomerOrdersUseCase(OrderRepo);
      const command = new GetCustomerOrdersCommand(
        customerId,
        args.limit ?? 20,
        args.offset ?? 0,
        args.orderBy ?? 'createdAt',
        args.orderDirection ?? 'desc',
      );
      return useCase.execute(command);
    },

    orders: async (_parent: unknown, args: {
      filters?: Record<string, unknown>;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListOrdersUseCase(OrderRepo);
      const command = new ListOrdersCommand(
        args.filters as Record<string, unknown> | undefined,
        args.limit ?? 50,
        args.offset ?? 0,
        args.orderBy ?? 'createdAt',
        args.orderDirection ?? 'desc',
      );
      return useCase.execute(command);
    },
  },
};
