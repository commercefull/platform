import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetDashboardMetricsInput } from '../../application/useCases/GetDashboardMetrics';
import { GetSalesAnalyticsInput } from '../../application/useCases/GetSalesAnalytics';
import { GetProductPerformanceInput } from '../../application/useCases/GetProductPerformance';
import { TrackPageViewCommand } from '../../application/useCases/TrackPageView';
import { GenerateSalesReportCommand } from '../../application/useCases/GenerateSalesReport';
import {
  generateSalesReportUseCase,
  getDashboardMetricsUseCase,
  getProductPerformanceUseCase,
  getSalesAnalyticsUseCase,
  trackPageViewUseCase,
} from '../../application/wired';

export const analyticsResolvers = {
  Query: {
    dashboardMetrics: async (_parent: unknown, args: { input: GetDashboardMetricsInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const input: GetDashboardMetricsInput = {
        ...args.input,
        startDate: new Date(args.input.startDate),
        endDate: new Date(args.input.endDate),
      };
      return getDashboardMetricsUseCase.execute(input);
    },

    salesAnalytics: async (_parent: unknown, args: { input: GetSalesAnalyticsInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const input: GetSalesAnalyticsInput = {
        ...args.input,
        startDate: new Date(args.input.startDate),
        endDate: new Date(args.input.endDate),
      };
      return getSalesAnalyticsUseCase.execute(input);
    },

    productPerformance: async (_parent: unknown, args: { input: GetProductPerformanceInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const input: GetProductPerformanceInput = {
        ...args.input,
        startDate: new Date(args.input.startDate),
        endDate: new Date(args.input.endDate),
      };
      return getProductPerformanceUseCase.execute(input);
    },
  },

  Mutation: {
    trackPageView: async (_parent: unknown, args: { input: TrackPageViewCommand }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      return trackPageViewUseCase.execute(args.input);
    },

    generateSalesReport: async (_parent: unknown, args: { input: GenerateSalesReportCommand }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const command: GenerateSalesReportCommand = {
        ...args.input,
        startDate: new Date(args.input.startDate),
        endDate: new Date(args.input.endDate),
      };
      return generateSalesReportUseCase.execute(command);
    },
  },
};
