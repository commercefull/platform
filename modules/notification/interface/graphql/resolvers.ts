import { requireAuth, requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetNotificationsInput } from '../../application/useCases/GetNotifications';
import { SendNotificationInput } from '../../application/useCases/SendNotification';
import { MarkAsReadInput } from '../../application/useCases/MarkAsRead';
import { getNotificationsUseCase, markAsReadUseCase, sendNotificationUseCase } from '../../application/useCases/wired';

export const notificationResolvers = {
  Query: {
    notifications: async (_parent: unknown, args: { input: GetNotificationsInput }, context: GraphQLAuthContext) => {
      requireAuth(context);
      return getNotificationsUseCase.execute(args.input);
    },
  },

  Mutation: {
    sendNotification: async (_parent: unknown, args: { input: SendNotificationInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const input: SendNotificationInput = {
        ...args.input,
        scheduledAt: args.input.scheduledAt ? new Date(args.input.scheduledAt) : undefined,
      };
      return sendNotificationUseCase.execute(input);
    },

    markNotificationsAsRead: async (
      _parent: unknown,
      args: {
        notificationIds: string[];
        recipientId: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireAuth(context);
      const input: MarkAsReadInput = {
        notificationIds: args.notificationIds,
        recipientId: args.recipientId,
      };
      return markAsReadUseCase.execute(input);
    },
  },
};
