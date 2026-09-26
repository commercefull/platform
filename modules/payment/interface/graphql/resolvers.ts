import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { InitiatePaymentCommand } from '../../application/useCases/InitiatePayment';
import {
  GetTransactionCommand,
  ListTransactionsCommand,
} from '../../application/useCases';
import { ProcessPaymentRefundCommand } from '../../application/useCases/ProcessRefund';
import { GetPaymentMethodsInput } from '../../application/useCases/GetPaymentMethods';
import { CapturePaymentInput } from '../../application/useCases/CapturePayment';
import {
  capturePaymentUseCase,
  getPaymentMethodsUseCase,
  getTransactionUseCase,
  initiatePaymentUseCase,
  listTransactionsUseCase,
  processPaymentRefundUseCase,
} from '../../application/useCases/wired';

export const paymentResolvers = {
  Query: {
    paymentMethods: async (_parent: unknown, args: { input?: GetPaymentMethodsInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return getPaymentMethodsUseCase.execute(args.input || {});
    },

    transaction: async (
      _parent: unknown,
      args: {
        transactionId?: string;
        externalId?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const command = new GetTransactionCommand(args.transactionId, args.externalId);
      return getTransactionUseCase.execute(command);
    },

    transactions: async (
      _parent: unknown,
      args: {
        filters?: Record<string, unknown>;
        limit?: number;
        offset?: number;
        orderBy?: string;
        orderDirection?: 'asc' | 'desc';
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const command = new ListTransactionsCommand(
        args.filters as Record<string, unknown> | undefined,
        args.limit ?? 50,
        args.offset ?? 0,
        args.orderBy ?? 'createdAt',
        args.orderDirection ?? 'desc',
      );
      return listTransactionsUseCase.execute(command);
    },
  },

  Mutation: {
    initiatePayment: async (
      _parent: unknown,
      args: {
        orderId: string;
        amountCents: number;
        currency: string;
        paymentMethodConfigId: string;
        customerId?: string;
        customerIp?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const command = new InitiatePaymentCommand(
        args.orderId,
        args.amountCents,
        args.currency,
        args.paymentMethodConfigId,
        args.customerId,
        args.customerIp,
      );
      return initiatePaymentUseCase.execute(command);
    },

    processRefund: async (
      _parent: unknown,
      args: {
        transactionId: string;
        amountCents: number;
        reason?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const command = new ProcessPaymentRefundCommand(args.transactionId, args.amountCents, args.reason);
      return processPaymentRefundUseCase.execute(command);
    },

    capturePayment: async (
      _parent: unknown,
      args: {
        transactionId: string;
        amountCents?: number;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const input: CapturePaymentInput = {
        transactionId: args.transactionId,
        amountCents: args.amountCents,
      };
      return capturePaymentUseCase.execute(input);
    },
  },
};
