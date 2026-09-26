import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetFulfillmentInput } from '../../application/useCases/GetFulfillment';
import { CreateFulfillmentInput } from '../../application/useCases/CreateFulfillment';
import { ShipOrderInput } from '../../application/useCases/ShipOrder';
import { MarkDeliveredInput } from '../../application/useCases/MarkDelivered';
import { CancelFulfillmentCommand } from '../../application/useCases/CancelFulfillment';
import { UpdateTrackingCommand } from '../../application/useCases/UpdateTracking';
import {
  cancelFulfillmentUseCase,
  createFulfillmentUseCase,
  getFulfillmentUseCase,
  markDeliveredUseCase,
  shipOrderUseCase,
  updateTrackingUseCase,
} from '../../application/wired';

export const fulfillmentResolvers = {
  Query: {
    fulfillment: async (
      _parent: unknown,
      args: {
        fulfillmentId?: string;
        trackingNumber?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const input: GetFulfillmentInput = {
        fulfillmentId: args.fulfillmentId,
        trackingNumber: args.trackingNumber,
      };
      return getFulfillmentUseCase.execute(input);
    },
  },

  Mutation: {
    createFulfillment: async (_parent: unknown, args: { input: CreateFulfillmentInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return createFulfillmentUseCase.execute(args.input);
    },

    shipOrder: async (
      _parent: unknown,
      args: {
        fulfillmentId: string;
        trackingNumber: string;
        trackingUrl?: string;
        carrierId?: string;
        carrierName?: string;
        shippingCostCents?: number;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const input: ShipOrderInput = {
        fulfillmentId: args.fulfillmentId,
        trackingNumber: args.trackingNumber,
        trackingUrl: args.trackingUrl,
        carrierId: args.carrierId,
        carrierName: args.carrierName,
        shippingCostCents: args.shippingCostCents,
      };
      return shipOrderUseCase.execute(input);
    },

    markDelivered: async (_parent: unknown, args: { fulfillmentId: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const input: MarkDeliveredInput = { fulfillmentId: args.fulfillmentId };
      return markDeliveredUseCase.execute(input);
    },

    cancelFulfillment: async (
      _parent: unknown,
      args: {
        fulfillmentId: string;
        reason?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const command = new CancelFulfillmentCommand(args.fulfillmentId, args.reason);
      return cancelFulfillmentUseCase.execute(command);
    },

    updateTracking: async (
      _parent: unknown,
      args: {
        fulfillmentId: string;
        trackingNumber: string;
        trackingUrl?: string;
      },
      context: GraphQLAuthContext,
    ) => {
      requireBusinessAuth(context);
      const command = new UpdateTrackingCommand(args.fulfillmentId, args.trackingNumber, args.trackingUrl);
      return updateTrackingUseCase.execute(command);
    },
  },
};
