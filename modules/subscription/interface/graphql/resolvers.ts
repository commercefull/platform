import { requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreateSubscriptionCommand, CreateSubscriptionInput } from '../../application/useCases/CreateSubscription';
import { CancelSubscriptionCommand, CancelSubscriptionInput } from '../../application/useCases/CancelSubscription';
import type { ChangeSubscriptionPlanInput } from '../../application/useCases/ChangeSubscriptionPlan';
import type { PauseSubscriptionInput } from '../../application/useCases/PauseSubscription';
import type { ResumeSubscriptionInput } from '../../application/useCases/ResumeSubscription';
import {
  createSubscriptionUseCase,
  cancelSubscriptionUseCase,
  changeSubscriptionPlanUseCase,
  pauseSubscriptionEntityUseCase,
  resumeSubscriptionEntityUseCase,
  manageCustomerSubscriptionsUseCase,
} from '../../application/wired';

export const subscriptionResolvers = {
  Query: {
    subscription: async (_parent: unknown, args: { customerSubscriptionId: string }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return manageCustomerSubscriptionsUseCase.getCustomerSubscription(args.customerSubscriptionId);
    },
  },

  Mutation: {
    createSubscription: async (_parent: unknown, args: { input: CreateSubscriptionInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = createSubscriptionUseCase;
      const command = new CreateSubscriptionCommand(args.input);
      return useCase.execute(command);
    },

    cancelSubscription: async (_parent: unknown, args: { input: CancelSubscriptionInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = cancelSubscriptionUseCase;
      const command = new CancelSubscriptionCommand(args.input);
      return useCase.execute(command);
    },

    changeSubscriptionPlan: async (
      _parent: unknown,
      args: {
        subscriptionId: string;
        newPlanId: string;
        applyImmediately?: boolean;
        prorateCharges?: boolean;
      },
      context: GraphQLAuthContext,
    ) => {
      requireCustomerAuth(context);
      const useCase = changeSubscriptionPlanUseCase;
      const input: ChangeSubscriptionPlanInput = {
        subscriptionId: args.subscriptionId,
        newPlanId: args.newPlanId,
        applyImmediately: args.applyImmediately,
        prorateCharges: args.prorateCharges,
      };
      return useCase.execute(input);
    },

    pauseSubscription: async (
      _parent: unknown,
      args: {
        subscriptionId: string;
        reason?: string;
        pauseUntil?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireCustomerAuth(context);
      const useCase = pauseSubscriptionEntityUseCase;
      const input: PauseSubscriptionInput = {
        subscriptionId: args.subscriptionId,
        reason: args.reason,
        pauseUntil: args.pauseUntil ? new Date(args.pauseUntil) : undefined,
      };
      return useCase.execute(input);
    },

    resumeSubscription: async (_parent: unknown, args: { subscriptionId: string }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = resumeSubscriptionEntityUseCase;
      const input: ResumeSubscriptionInput = { subscriptionId: args.subscriptionId };
      return useCase.execute(input);
    },
  },
};
