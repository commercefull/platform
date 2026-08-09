import DashboardQueryRepo from '../../infrastructure/repositories/DashboardQueryRepository';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { GetDashboardMetricsUseCase, GetDashboardMetricsInput } from '../../application/useCases/GetDashboardMetrics';
import { GetSalesAnalyticsUseCase, GetSalesAnalyticsInput } from '../../application/useCases/GetSalesAnalytics';
import { GetProductPerformanceUseCase, GetProductPerformanceInput } from '../../application/useCases/GetProductPerformance';
import { TrackPageViewUseCase, TrackPageViewCommand } from '../../application/useCases/TrackPageView';
import { GenerateSalesReportUseCase, GenerateSalesReportCommand } from '../../application/useCases/GenerateSalesReport';

export const analyticsResolvers = {
  Query: {
    dashboardMetrics: async (_parent: unknown, args: { input: GetDashboardMetricsInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetDashboardMetricsUseCase(DashboardQueryRepo as never);
      const input: GetDashboardMetricsInput = {
        ...args.input,
        startDate: new Date(args.input.startDate),
        endDate: new Date(args.input.endDate),
      };
      return useCase.execute(input);
    },

    salesAnalytics: async (_parent: unknown, args: { input: GetSalesAnalyticsInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetSalesAnalyticsUseCase(DashboardQueryRepo as never);
      const input: GetSalesAnalyticsInput = {
        ...args.input,
        startDate: new Date(args.input.startDate),
        endDate: new Date(args.input.endDate),
      };
      return useCase.execute(input);
    },

    productPerformance: async (_parent: unknown, args: { input: GetProductPerformanceInput }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GetProductPerformanceUseCase(DashboardQueryRepo as never);
      const input: GetProductPerformanceInput = {
        ...args.input,
        startDate: new Date(args.input.startDate),
        endDate: new Date(args.input.endDate),
      };
      return useCase.execute(input);
    },
  },

  Mutation: {
    trackPageView: async (_parent: unknown, args: { input: TrackPageViewCommand }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new TrackPageViewUseCase();
      return useCase.execute(args.input);
    },

    generateSalesReport: async (_parent: unknown, args: { input: GenerateSalesReportCommand }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GenerateSalesReportUseCase();
      const command: GenerateSalesReportCommand = {
        ...args.input,
        startDate: new Date(args.input.startDate),
        endDate: new Date(args.input.endDate),
      };
      return useCase.execute(command);
    },
  },
};
