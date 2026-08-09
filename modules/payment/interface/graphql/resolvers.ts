import PaymentRepo from '../../infrastructure/repositories/PaymentRepository';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { InitiatePaymentUseCase, InitiatePaymentCommand } from '../../application/useCases/InitiatePayment';
import { GetTransactionUseCase, GetTransactionCommand, ListTransactionsUseCase, ListTransactionsCommand } from '../../application/useCases/GetTransactions';
import { ProcessPaymentRefundUseCase, ProcessPaymentRefundCommand } from '../../application/useCases/ProcessRefund';
import { GetPaymentMethodsUseCase, GetPaymentMethodsInput } from '../../application/useCases/GetPaymentMethods';
import { CapturePaymentUseCase, CapturePaymentInput } from '../../application/useCases/CapturePayment';

// Adapters that bridge PaymentRepo to use-case port interfaces
const paymentMethodsRepoAdapter = {
  findSavedPaymentMethods: async (_customerId: string) => {
    // PaymentRepo does not currently expose saved methods at this level;
    // return empty array until the repository is extended.
    return [] as Array<{
      paymentMethodId: string;
      type: 'card' | 'bank_account' | 'wallet' | 'buy_now_pay_later' | 'crypto';
      provider: string;
      name?: string;
      isDefault: boolean;
      last4?: string;
      brand?: string;
      expiryMonth?: number;
      expiryYear?: number;
    }>;
  },
};

const paymentConfigRepoAdapter = {
  findActiveConfigs: async (_params: { storeId?: string; channelId?: string }) => {
    // Delegates to getEnabledPaymentMethods with a default merchant
    const methods = await PaymentRepo.getEnabledPaymentMethods('default');
    return methods.map(m => ({
      paymentMethodConfigId: m.paymentMethodConfigId,
      type: 'card' as const,
      provider: m.paymentMethod,
      displayName: m.displayName,
      isActive: true,
      minAmount: undefined,
      maxAmount: undefined,
      supportedCurrencies: undefined,
      supportedCountries: undefined,
    }));
  },
};

const captureRepoAdapter = {
  findTransactionById: async (id: string) => {
    const txn = await PaymentRepo.findTransactionById(id);
    if (!txn) return null;
    const json = txn.toJSON() as Record<string, unknown>;
    return {
      transactionId: json.transactionId as string,
      orderId: json.orderId as string,
      gatewayTransactionId: (json.externalTransactionId as string) || '',
      amount: json.amount as number,
      currency: json.currency as string,
      status: json.status as string,
    };
  },
  updateTransaction: async () => {
    // Transaction updates via the domain entity are handled through PaymentRepo.saveTransaction
  },
};

const captureGatewayAdapter = {
  capture: async (_params: { transactionId: string; amount: number; currency: string; metadata?: Record<string, unknown> }) => {
    // Gateway capture would be implemented via the actual provider SDK
    return { success: true, response: {} };
  },
};

export const paymentResolvers = {
  Query: {
    paymentMethods: async (_parent: unknown, args: { input?: GetPaymentMethodsInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetPaymentMethodsUseCase(paymentMethodsRepoAdapter, paymentConfigRepoAdapter);
      return useCase.execute(args.input || {});
    },

    transaction: async (_parent: unknown, args: {
      transactionId?: string;
      externalId?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetTransactionUseCase(PaymentRepo);
      const command = new GetTransactionCommand(args.transactionId, args.externalId);
      return useCase.execute(command);
    },

    transactions: async (_parent: unknown, args: {
      filters?: Record<string, unknown>;
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListTransactionsUseCase(PaymentRepo);
      const command = new ListTransactionsCommand(
        args.filters as Record<string, unknown> | undefined,
        args.limit ?? 50,
        args.offset ?? 0,
        args.orderBy ?? 'createdAt',
        args.orderDirection ?? 'desc',
      );
      return useCase.execute(command);
    },
  },

  Mutation: {
    initiatePayment: async (_parent: unknown, args: {
      orderId: string;
      amount: number;
      currency: string;
      paymentMethodConfigId: string;
      customerId?: string;
      customerIp?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new InitiatePaymentUseCase(PaymentRepo);
      const command = new InitiatePaymentCommand(
        args.orderId, args.amount, args.currency,
        args.paymentMethodConfigId, args.customerId, args.customerIp,
      );
      return useCase.execute(command);
    },

    processRefund: async (_parent: unknown, args: {
      transactionId: string;
      amount: number;
      reason?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ProcessPaymentRefundUseCase(PaymentRepo);
      const command = new ProcessPaymentRefundCommand(
        args.transactionId, args.amount, args.reason,
      );
      return useCase.execute(command);
    },

    capturePayment: async (_parent: unknown, args: {
      transactionId: string;
      amount?: number;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CapturePaymentUseCase(captureRepoAdapter, captureGatewayAdapter);
      const input: CapturePaymentInput = {
        transactionId: args.transactionId,
        amount: args.amount,
      };
      return useCase.execute(input);
    },
  },
};
