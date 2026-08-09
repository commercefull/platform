import * as subscriptionRepo from '../../infrastructure/repositories/subscriptionRepo';
import { requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreateSubscriptionUseCase, CreateSubscriptionCommand, CreateSubscriptionInput } from '../../application/useCases/CreateSubscription';
import { CancelSubscriptionUseCase, CancelSubscriptionCommand, CancelSubscriptionInput } from '../../application/useCases/CancelSubscription';
import { ChangeSubscriptionPlanUseCase, ChangeSubscriptionPlanInput } from '../../application/useCases/ChangeSubscriptionPlan';
import { PauseSubscriptionUseCase, PauseSubscriptionInput } from '../../application/useCases/PauseSubscription';
import { ResumeSubscriptionUseCase, ResumeSubscriptionInput } from '../../application/useCases/ResumeSubscription';

// Adapter to adapt the repo module to the port interface expected by use cases
const subscriptionRepoAdapter = {
  async findById(id: string) {
    const sub = await subscriptionRepo.getCustomerSubscription(id);
    if (!sub) return null;
    return {
      status: sub.status,
      planId: sub.subscriptionPlanId,
      customerId: sub.customerId,
      nextBillingDate: sub.nextBillingAt?.toISOString() ?? new Date().toISOString(),
      currentPeriodStart: sub.currentPeriodStart?.toISOString(),
      startDate: sub.createdAt.toISOString(),
      price: sub.totalPrice,
      billingInterval: sub.billingInterval,
    };
  },
  async update(id: string, data: Record<string, unknown>) {
    await subscriptionRepo.updateSubscriptionStatus(
      id,
      (data.status as subscriptionRepo.SubscriptionStatus) ?? 'active',
    );
  },
};

const planRepoAdapter = {
  async findById(id: string) {
    const plan = await subscriptionRepo.getSubscriptionPlan(id);
    if (!plan) return null;
    return { price: plan.price };
  },
};

export const subscriptionResolvers = {
  Query: {
    subscription: async (_parent: unknown, args: { customerSubscriptionId: string }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return subscriptionRepo.getCustomerSubscription(args.customerSubscriptionId);
    },
  },

  Mutation: {
    createSubscription: async (_parent: unknown, args: { input: CreateSubscriptionInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new CreateSubscriptionUseCase();
      const command = new CreateSubscriptionCommand(args.input);
      return useCase.execute(command);
    },

    cancelSubscription: async (_parent: unknown, args: { input: CancelSubscriptionInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new CancelSubscriptionUseCase();
      const command = new CancelSubscriptionCommand(args.input);
      return useCase.execute(command);
    },

    changeSubscriptionPlan: async (_parent: unknown, args: {
      subscriptionId: string;
      newPlanId: string;
      applyImmediately?: boolean;
      prorateCharges?: boolean;
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new ChangeSubscriptionPlanUseCase(subscriptionRepoAdapter, planRepoAdapter);
      const input: ChangeSubscriptionPlanInput = {
        subscriptionId: args.subscriptionId,
        newPlanId: args.newPlanId,
        applyImmediately: args.applyImmediately,
        prorateCharges: args.prorateCharges,
      };
      return useCase.execute(input);
    },

    pauseSubscription: async (_parent: unknown, args: {
      subscriptionId: string;
      reason?: string;
      pauseUntil?: string;
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new PauseSubscriptionUseCase(subscriptionRepoAdapter);
      const input: PauseSubscriptionInput = {
        subscriptionId: args.subscriptionId,
        reason: args.reason,
        pauseUntil: args.pauseUntil ? new Date(args.pauseUntil) : undefined,
      };
      return useCase.execute(input);
    },

    resumeSubscription: async (_parent: unknown, args: { subscriptionId: string }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new ResumeSubscriptionUseCase(subscriptionRepoAdapter);
      const input: ResumeSubscriptionInput = { subscriptionId: args.subscriptionId };
      return useCase.execute(input);
    },
  },
};
