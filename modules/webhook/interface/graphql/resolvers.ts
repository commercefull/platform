import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import type { RegisterWebhookInput } from '../../application/useCases/RegisterWebhook';
import {
  listWebhooksUseCase,
  registerWebhookUseCase,
  unregisterWebhookUseCase,
} from '../../application/wired';

export const webhookResolvers = {
  Query: {
    webhooks: async (_parent: unknown, args: { organizationId?: string; limit?: number; offset?: number }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = listWebhooksUseCase;
      const result = await useCase.execute(
        args.organizationId ? { organizationId: args.organizationId } : undefined,
        args.limit ?? 50,
        args.offset ?? 0,
      );
      return Array.isArray(result) ? result : result.data || [];
    },
  },

  Mutation: {
    registerWebhook: async (
      _parent: unknown,
      args: { input: { name: string; url: string; events: string[]; organizationId?: string; headers?: string } },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const useCase = registerWebhookUseCase;
      const input: RegisterWebhookInput = {
        name: args.input.name,
        url: args.input.url,
        events: args.input.events,
        organizationId: args.input.organizationId,
        headers: args.input.headers ? JSON.parse(args.input.headers) : undefined,
      };
      return useCase.execute(input);
    },

    unregisterWebhook: async (_parent: unknown, args: { webhookEndpointId: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = unregisterWebhookUseCase;
      const deleted = await useCase.execute(args.webhookEndpointId);
      return { deleted };
    },
  },
};
