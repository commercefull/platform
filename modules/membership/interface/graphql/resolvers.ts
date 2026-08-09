import { MembershipRepo } from '../../infrastructure/repositories/membershipRepo';
import { requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { AssignMembershipUseCase, AssignMembershipInput } from '../../application/useCases/AssignMembership';
import { GetMembershipBenefitsUseCase, GetMembershipBenefitsInput } from '../../application/useCases/GetMembershipBenefits';
import { CancelMembershipUseCase, CancelMembershipInput } from '../../application/useCases/CancelMembership';
import { UpgradeMembershipUseCase, UpgradeMembershipInput } from '../../application/useCases/UpgradeMembership';
import { RenewMembershipUseCase, RenewMembershipInput } from '../../application/useCases/RenewMembership';

const membershipRepo = new MembershipRepo();

export const membershipResolvers = {
  Query: {
    membershipBenefits: async (_parent: unknown, args: { customerId: string }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new GetMembershipBenefitsUseCase(membershipRepo as unknown as ConstructorParameters<typeof GetMembershipBenefitsUseCase>[0]);
      const input: GetMembershipBenefitsInput = { customerId: args.customerId };
      return useCase.execute(input);
    },
  },

  Mutation: {
    assignMembership: async (_parent: unknown, args: { input: AssignMembershipInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new AssignMembershipUseCase(membershipRepo as unknown as ConstructorParameters<typeof AssignMembershipUseCase>[0]);
      const input: AssignMembershipInput = {
        customerId: args.input.customerId,
        tierId: args.input.tierId,
        paymentMethodId: args.input.paymentMethodId,
        startDate: args.input.startDate ? new Date(args.input.startDate) : undefined,
        source: args.input.source as AssignMembershipInput['source'],
      };
      return useCase.execute(input);
    },

    cancelMembership: async (_parent: unknown, args: {
      membershipId: string;
      reason?: string;
      feedback?: string;
      immediate?: boolean;
      cancelledBy?: string;
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new CancelMembershipUseCase(membershipRepo as unknown as ConstructorParameters<typeof CancelMembershipUseCase>[0]);
      const input: CancelMembershipInput = {
        membershipId: args.membershipId,
        reason: args.reason,
        feedback: args.feedback,
        immediate: args.immediate ?? false,
        cancelledBy: args.cancelledBy,
      };
      return useCase.execute(input);
    },

    upgradeMembership: async (_parent: unknown, args: {
      membershipId: string;
      newTierId: string;
      prorateBilling?: boolean;
      effectiveDate?: string;
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new UpgradeMembershipUseCase(membershipRepo as unknown as ConstructorParameters<typeof UpgradeMembershipUseCase>[0]);
      const input: UpgradeMembershipInput = {
        membershipId: args.membershipId,
        newTierId: args.newTierId,
        prorateBilling: args.prorateBilling,
        effectiveDate: args.effectiveDate ? new Date(args.effectiveDate) : undefined,
      };
      return useCase.execute(input);
    },

    renewMembership: async (_parent: unknown, args: {
      membershipId: string;
      paymentMethodId?: string;
      autoRenew?: boolean;
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new RenewMembershipUseCase(membershipRepo as unknown as ConstructorParameters<typeof RenewMembershipUseCase>[0]);
      const input: RenewMembershipInput = {
        membershipId: args.membershipId,
        paymentMethodId: args.paymentMethodId,
        autoRenew: args.autoRenew,
      };
      return useCase.execute(input);
    },
  },
};
