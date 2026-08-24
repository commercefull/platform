import notificationDataRepository from '../../infrastructure/repositories/NotificationDataRepository';

const NotificationRepo = notificationDataRepository.notifications;
import { requireAuth, requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetNotificationsUseCase, GetNotificationsInput } from '../../application/useCases/GetNotifications';
import { SendNotificationUseCase, SendNotificationInput } from '../../application/useCases/SendNotification';
import { MarkAsReadUseCase, MarkAsReadInput } from '../../application/useCases/MarkAsRead';

export const notificationResolvers = {
  Query: {
    notifications: async (_parent: unknown, args: { input: GetNotificationsInput }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = new GetNotificationsUseCase(NotificationRepo);
      return useCase.execute(args.input);
    },
  },

  Mutation: {
    sendNotification: async (_parent: unknown, args: { input: SendNotificationInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new SendNotificationUseCase(NotificationRepo, NotificationRepo);
      const input: SendNotificationInput = {
        ...args.input,
        scheduledAt: args.input.scheduledAt ? new Date(args.input.scheduledAt) : undefined,
      };
      return useCase.execute(input);
    },

    markNotificationsAsRead: async (_parent: unknown, args: {
      notificationIds: string[];
      recipientId: string;
    }, context: GraphQLAuthContext) => {
      requireAuth(context);
      const useCase = new MarkAsReadUseCase(NotificationRepo);
      const input: MarkAsReadInput = {
        notificationIds: args.notificationIds,
        recipientId: args.recipientId,
      };
      return useCase.execute(input);
    },
  },
};
