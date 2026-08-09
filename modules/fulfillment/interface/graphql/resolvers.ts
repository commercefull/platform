import fulfillmentRepository from '../../infrastructure/repositories/FulfillmentRepository';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetFulfillmentUseCase, GetFulfillmentInput } from '../../application/useCases/GetFulfillment';
import { CreateFulfillmentUseCase, CreateFulfillmentInput } from '../../application/useCases/CreateFulfillment';
import { ShipOrderUseCase, ShipOrderInput } from '../../application/useCases/ShipOrder';
import { MarkDeliveredUseCase, MarkDeliveredInput } from '../../application/useCases/MarkDelivered';
import { CancelFulfillmentUseCase, CancelFulfillmentCommand } from '../../application/useCases/CancelFulfillment';
import { UpdateTrackingUseCase, UpdateTrackingCommand } from '../../application/useCases/UpdateTracking';

export const fulfillmentResolvers = {
  Query: {
    fulfillment: async (_parent: unknown, args: {
      fulfillmentId?: string;
      trackingNumber?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetFulfillmentUseCase(fulfillmentRepository);
      const input: GetFulfillmentInput = {
        fulfillmentId: args.fulfillmentId,
        trackingNumber: args.trackingNumber,
      };
      return useCase.execute(input);
    },
  },

  Mutation: {
    createFulfillment: async (_parent: unknown, args: { input: CreateFulfillmentInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateFulfillmentUseCase(fulfillmentRepository);
      return useCase.execute(args.input);
    },

    shipOrder: async (_parent: unknown, args: {
      fulfillmentId: string;
      trackingNumber: string;
      trackingUrl?: string;
      carrierId?: string;
      carrierName?: string;
      shippingCost?: number;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ShipOrderUseCase(fulfillmentRepository);
      const input: ShipOrderInput = {
        fulfillmentId: args.fulfillmentId,
        trackingNumber: args.trackingNumber,
        trackingUrl: args.trackingUrl,
        carrierId: args.carrierId,
        carrierName: args.carrierName,
        shippingCost: args.shippingCost,
      };
      return useCase.execute(input);
    },

    markDelivered: async (_parent: unknown, args: { fulfillmentId: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new MarkDeliveredUseCase(fulfillmentRepository);
      const input: MarkDeliveredInput = { fulfillmentId: args.fulfillmentId };
      return useCase.execute(input);
    },

    cancelFulfillment: async (_parent: unknown, args: {
      fulfillmentId: string;
      reason?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CancelFulfillmentUseCase(fulfillmentRepository);
      const command = new CancelFulfillmentCommand(args.fulfillmentId, args.reason);
      return useCase.execute(command);
    },

    updateTracking: async (_parent: unknown, args: {
      fulfillmentId: string;
      trackingNumber: string;
      trackingUrl?: string;
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new UpdateTrackingUseCase(fulfillmentRepository);
      const command = new UpdateTrackingCommand(
        args.fulfillmentId, args.trackingNumber, args.trackingUrl,
      );
      return useCase.execute(command);
    },
  },
};
