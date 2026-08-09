import WebhookRepo from '../../infrastructure/repositories/WebhookRepository';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { RegisterWebhookUseCase, RegisterWebhookInput } from '../../application/useCases/RegisterWebhook';
import { ListWebhooksUseCase } from '../../application/useCases/ListWebhooks';
import { UnregisterWebhookUseCase } from '../../application/useCases/UnregisterWebhook';

export const webhookResolvers = {
  Query: {
    webhooks: async (_parent: unknown, args: { merchantId?: string; limit?: number; offset?: number }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListWebhooksUseCase(WebhookRepo);
      const result = await useCase.execute(
        args.merchantId ? { merchantId: args.merchantId } : undefined,
        args.limit ?? 50,
        args.offset ?? 0,
      );
      return Array.isArray(result) ? result : result.data || [];
    },
  },

  Mutation: {
    registerWebhook: async (_parent: unknown, args: { input: { name: string; url: string; events: string[]; merchantId?: string; headers?: string } }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new RegisterWebhookUseCase(WebhookRepo);
      const input: RegisterWebhookInput = {
        name: args.input.name,
        url: args.input.url,
        events: args.input.events,
        merchantId: args.input.merchantId,
        headers: args.input.headers ? JSON.parse(args.input.headers) : undefined,
      };
      return useCase.execute(input);
    },

    unregisterWebhook: async (_parent: unknown, args: { webhookEndpointId: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new UnregisterWebhookUseCase(WebhookRepo);
      const deleted = await useCase.execute(args.webhookEndpointId);
      return { deleted };
    },
  },
};
