import gdprDataRepository from '../../infrastructure/repositories/GdprDataRepository';
import { requireCustomerAuth, requireAdminAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreateDataRequestUseCase, CreateDataRequestCommand } from '../../application/useCases/CreateDataRequest';
import { ProcessDataRequestUseCase, ProcessExportRequestCommand, ProcessDeletionRequestCommand, RejectRequestCommand } from '../../application/useCases/ProcessDataRequest';
import { ManageCookieConsentUseCase, RecordCookieConsentCommand } from '../../application/useCases/ManageCookieConsent';

const dataRequestRepo = gdprDataRepository.dataRequests;
const cookieConsentRepo = gdprDataRepository.cookieConsent;

export const gdprResolvers = {
  Mutation: {
    createDataRequest: async (_parent: unknown, args: {
      input: {
        customerId: string;
        requestType: 'export' | 'deletion' | 'rectification' | 'restriction' | 'objection' | 'access';
        reason?: string;
        requestedData?: string[];
        ipAddress?: string;
        userAgent?: string;
      };
    }, context: GraphQLAuthContext) => {
      requireCustomerAuth(context);
      const useCase = new CreateDataRequestUseCase(dataRequestRepo);
      const command = new CreateDataRequestCommand(
        args.input.customerId,
        args.input.requestType,
        args.input.reason,
        args.input.requestedData,
        args.input.ipAddress,
        args.input.userAgent,
      );
      return useCase.execute(command);
    },

    processDataRequest: async (_parent: unknown, args: {
      input: {
        gdprDataRequestId: string;
        adminId: string;
        action: 'export' | 'delete' | 'reject';
        format?: 'json' | 'csv' | 'xml';
        notes?: string;
        reason?: string;
      };
    }, context: GraphQLAuthContext) => {
      requireAdminAuth(context);
      const useCase = new ProcessDataRequestUseCase(dataRequestRepo, dataRequestRepo as never);
      if (args.input.action === 'export') {
        const cmd = new ProcessExportRequestCommand(args.input.gdprDataRequestId, args.input.adminId, args.input.format || 'json');
        return useCase.processExport(cmd);
      } else if (args.input.action === 'delete') {
        const cmd = new ProcessDeletionRequestCommand(args.input.gdprDataRequestId, args.input.adminId, args.input.notes);
        return useCase.processDeletion(cmd);
      } else {
        const cmd = new RejectRequestCommand(args.input.gdprDataRequestId, args.input.adminId, args.input.reason || '');
        return useCase.reject(cmd);
      }
    },

    recordCookieConsent: async (_parent: unknown, args: {
      input: {
        sessionId: string;
        preferences: Record<string, boolean>;
        customerId?: string;
        ipAddress?: string;
        userAgent?: string;
        country?: string;
        region?: string;
        consentMethod?: 'banner' | 'settings' | 'api';
      };
    }) => {
      const useCase = new ManageCookieConsentUseCase(cookieConsentRepo);
      const command = new RecordCookieConsentCommand(
        args.input.sessionId,
        args.input.preferences,
        args.input.customerId,
        undefined,
        args.input.ipAddress,
        args.input.userAgent,
        args.input.country,
        args.input.region,
        undefined,
        args.input.consentMethod,
      );
      return useCase.recordConsent(command);
    },
  },
};
