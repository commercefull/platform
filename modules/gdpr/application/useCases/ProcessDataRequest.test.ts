import { createDataRequest, createGdprDataRequestRepository, createGdprService } from '../../tests/testUtils';
import {
  ProcessDataRequestUseCase,
  VerifyIdentityCommand,
  ProcessExportRequestCommand,
  ProcessDeletionRequestCommand,
  RejectRequestCommand,
} from './ProcessDataRequest';
import { DataRequestNotFoundError, GdprValidationError } from '../../domain/errors/GdprErrors';

describe('ProcessDataRequestUseCase', () => {
  it('should verify identity when the request exists', async () => {
    const repository = createGdprDataRequestRepository();

    const result = await new ProcessDataRequestUseCase(repository, createGdprService()).verifyIdentity(
      new VerifyIdentityCommand('req-1', 'email'),
    );

    expect(result.message).toBe('Identity verified successfully');
    expect(repository.save.mock.calls[0][0].identityVerified).toBe(true);
  });

  it('should complete an export request when identity is verified', async () => {
    const repository = createGdprDataRequestRepository(
      createDataRequest({ requestType: 'export', identityVerified: true }),
    );
    const gdprService = createGdprService();

    const result = await new ProcessDataRequestUseCase(repository, gdprService).processExport(
      new ProcessExportRequestCommand('req-1', 'admin-1'),
    );

    expect(result.status).toBe('completed');
    expect(result.downloadUrl).toBe('/gdpr/download/req-1');
    expect(result.processedAt).toBeDefined();
    expect(gdprService.exportCustomerData).toHaveBeenCalledWith('customer-1');
    expect(repository.save).toHaveBeenCalledTimes(2);
  });

  it('should throw GdprValidationError when exporting an unverified request', async () => {
    const repository = createGdprDataRequestRepository(createDataRequest({ requestType: 'export', identityVerified: false }));
    const gdprService = createGdprService();

    await expect(
      new ProcessDataRequestUseCase(repository, gdprService).processExport(new ProcessExportRequestCommand('req-1', 'admin-1')),
    ).rejects.toThrow(GdprValidationError);
    expect(gdprService.exportCustomerData).not.toHaveBeenCalled();
  });

  it('should throw GdprValidationError when processing a non-export request as export', async () => {
    const repository = createGdprDataRequestRepository(
      createDataRequest({ requestType: 'deletion', identityVerified: true }),
    );

    await expect(
      new ProcessDataRequestUseCase(repository, createGdprService()).processExport(
        new ProcessExportRequestCommand('req-1', 'admin-1'),
      ),
    ).rejects.toThrow(GdprValidationError);
  });

  it('should complete a deletion request when identity is verified', async () => {
    const repository = createGdprDataRequestRepository(
      createDataRequest({ requestType: 'deletion', identityVerified: true }),
    );
    const gdprService = createGdprService();

    const result = await new ProcessDataRequestUseCase(repository, gdprService).processDeletion(
      new ProcessDeletionRequestCommand('req-1', 'admin-1', 'cleanup'),
    );

    expect(result.status).toBe('completed');
    expect(gdprService.anonymizeCustomerData).toHaveBeenCalledWith('customer-1');
  });

  it('should reject the request when a reason is given', async () => {
    const repository = createGdprDataRequestRepository();

    const result = await new ProcessDataRequestUseCase(repository, createGdprService()).reject(
      new RejectRequestCommand('req-1', 'admin-1', 'Invalid request'),
    );

    expect(result.status).toBe('rejected');
    expect(result.processedAt).toBeDefined();
  });

  it('should throw GdprValidationError when the rejection reason is blank', async () => {
    const repository = createGdprDataRequestRepository();

    await expect(
      new ProcessDataRequestUseCase(repository, createGdprService()).reject(new RejectRequestCommand('req-1', 'admin-1', '  ')),
    ).rejects.toThrow(GdprValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw DataRequestNotFoundError when the request does not exist', async () => {
    const useCase = new ProcessDataRequestUseCase(createGdprDataRequestRepository(null), createGdprService());

    await expect(useCase.verifyIdentity(new VerifyIdentityCommand('missing', 'email'))).rejects.toThrow(
      DataRequestNotFoundError,
    );
    await expect(useCase.reject(new RejectRequestCommand('missing', 'admin-1', 'reason'))).rejects.toThrow(
      DataRequestNotFoundError,
    );
    await expect(useCase.processExport(new ProcessExportRequestCommand('missing', 'admin-1'))).rejects.toThrow(
      DataRequestNotFoundError,
    );
  });
});
