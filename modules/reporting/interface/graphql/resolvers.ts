import { GenerateReportUseCase } from '../../application/useCases/GenerateReport';
import { CreateReportScheduleUseCase } from '../../application/useCases/CreateReportSchedule';
import { ListReportSchedulesUseCase } from '../../application/useCases/ListReportSchedules';
import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';

export const reportingResolvers = {
  Query: {
    reportSchedules: async (_parent: unknown, args: { merchantId?: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new ListReportSchedulesUseCase();
      const schedules = await useCase.execute(args.merchantId);
      return {
        schedules: schedules.map(s => ({
          scheduleId: s.reportScheduleId,
          name: s.name,
          reportType: s.reportType,
          frequency: s.frequency,
          format: s.format,
          recipients: s.recipients,
          isActive: s.isActive,
          createdAt: s.createdAt.toISOString(),
        })),
      };
    },
  },

  Mutation: {
    generateReport: async (_parent: unknown, args: {
      input: { reportType: string; parameters: Record<string, unknown> };
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new GenerateReportUseCase();
      const result = await useCase.execute({
        reportType: args.input.reportType as never,
        parameters: args.input.parameters,
      });
      return {
        reportType: result.reportType,
        generatedAt: result.generatedAt.toISOString(),
        data: JSON.stringify(result.rows),
        summary: JSON.stringify(result.summary),
      };
    },

    createReportSchedule: async (_parent: unknown, args: {
      input: {
        merchantId?: string;
        name: string;
        reportType: string;
        frequency: string;
        parameters?: Record<string, unknown>;
        recipients?: string[];
        format?: string;
      };
    }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = new CreateReportScheduleUseCase();
      const result = await useCase.execute({
        merchantId: args.input.merchantId,
        name: args.input.name,
        reportType: args.input.reportType as never,
        frequency: args.input.frequency as never,
        parameters: args.input.parameters,
        recipients: args.input.recipients,
        format: args.input.format as never,
      });
      return {
        scheduleId: result.reportScheduleId,
        name: result.name,
        reportType: result.reportType,
        frequency: result.frequency,
        format: result.format,
        isActive: result.isActive,
        createdAt: result.createdAt.toISOString(),
      };
    },
  },
};
