import { requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { AssignMembershipInput } from '../../application/useCases/AssignMembership';
import { GetMembershipBenefitsInput } from '../../application/useCases/GetMembershipBenefits';
import { CancelMembershipInput } from '../../application/useCases/CancelMembership';
import { UpgradeMembershipInput } from '../../application/useCases/UpgradeMembership';
import { RenewMembershipInput } from '../../application/useCases/RenewMembership';
import {
  assignMembershipUseCase,
  cancelMembershipUseCase,
  getMembershipBenefitsUseCase,
  renewMembershipUseCase,
  upgradeMembershipUseCase,
} from '../../application/wired';

export const membershipResolvers = {
  Query: {
    membershipBenefits: async (_parent: unknown, args: { customerId: string }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const input: GetMembershipBenefitsInput = { customerId: args.customerId };
      return getMembershipBenefitsUseCase.execute(input);
    },
  },

  Mutation: {
    assignMembership: async (_parent: unknown, args: { input: AssignMembershipInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const input: AssignMembershipInput = {
        customerId: args.input.customerId,
        tierId: args.input.tierId,
        paymentMethodId: args.input.paymentMethodId,
        startDate: args.input.startDate ? new Date(args.input.startDate) : undefined,
        source: args.input.source as AssignMembershipInput['source'],
      };
      return assignMembershipUseCase.execute(input);
    },

    cancelMembership: async (
      _parent: unknown,
      args: {
        membershipId: string;
        reason?: string;
        feedback?: string;
        immediate?: boolean;
        cancelledBy?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireCustomerAuth(context);
      const input: CancelMembershipInput = {
        membershipId: args.membershipId,
        reason: args.reason,
        feedback: args.feedback,
        immediate: args.immediate ?? false,
        cancelledBy: args.cancelledBy,
      };
      return cancelMembershipUseCase.execute(input);
    },

    upgradeMembership: async (
      _parent: unknown,
      args: {
        membershipId: string;
        newTierId: string;
        prorateBilling?: boolean;
        effectiveDate?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireCustomerAuth(context);
      const input: UpgradeMembershipInput = {
        membershipId: args.membershipId,
        newTierId: args.newTierId,
        prorateBilling: args.prorateBilling,
        effectiveDate: args.effectiveDate ? new Date(args.effectiveDate) : undefined,
      };
      return upgradeMembershipUseCase.execute(input);
    },

    renewMembership: async (
      _parent: unknown,
      args: {
        membershipId: string;
        paymentMethodId?: string;
        autoRenew?: boolean;
      },
      context: GraphQLAuthContext,
    ) => {
      requireCustomerAuth(context);
      const input: RenewMembershipInput = {
        membershipId: args.membershipId,
        paymentMethodId: args.paymentMethodId,
        autoRenew: args.autoRenew,
      };
      return renewMembershipUseCase.execute(input);
    },
  },
};
