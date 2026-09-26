import { requireCustomerAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreateTicketInput } from '../../application/useCases/CreateTicket';
import { UpdateTicketInput } from '../../application/useCases/UpdateTicket';
import { GetCustomerTicketsInput } from '../../application/useCases/GetCustomerTickets';
import { AddTicketCommentInput } from '../../application/useCases/AddTicketComment';
import { SearchFAQInput } from '../../application/useCases/SearchFAQ';
import {
  addTicketCommentUseCase,
  createTicketUseCase,
  getCustomerTicketsUseCase,
  searchFaqUseCase,
  updateTicketUseCase,
} from '../../application/wired';

export const supportResolvers = {
  Query: {
    customerTickets: async (_parent: unknown, args: GetCustomerTicketsInput, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return getCustomerTicketsUseCase.execute(args);
    },

    searchFAQ: async (_parent: unknown, args: { input: SearchFAQInput }) => {
      return searchFaqUseCase.execute(args.input);
    },
  },

  Mutation: {
    createTicket: async (_parent: unknown, args: { input: CreateTicketInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return createTicketUseCase.execute(args.input);
    },

    updateTicket: async (_parent: unknown, args: { input: UpdateTicketInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return updateTicketUseCase.execute(args.input);
    },

    addTicketComment: async (_parent: unknown, args: { input: AddTicketCommentInput }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      return addTicketCommentUseCase.execute(args.input);
    },
  },
};
