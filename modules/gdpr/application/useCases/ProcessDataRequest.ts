/**
 * Process GDPR Data Request Use Case
 * Admin use case to process customer GDPR requests
 */

import { GdprDataRequestRepository, GdprService } from '../../domain/repositories/GdprRepository';
import { GdprDataRequest } from '../../domain/entities/GdprDataRequest';

// ============================================================================
// Commands
// ============================================================================

export class ProcessExportRequestCommand {
  constructor(
    public readonly gdprDataRequestId: string,
    public readonly adminId: string,
    public readonly format: 'json' | 'csv' | 'xml' = 'json'
  ) {}
}

export class ProcessDeletionRequestCommand {
  constructor(
    public readonly gdprDataRequestId: string,
    public readonly adminId: string,
    public readonly notes?: string
  ) {}
}

export class RejectRequestCommand {
  constructor(
    public readonly gdprDataRequestId: string,
    public readonly adminId: string,
    public readonly reason: string
  ) {}
}

export class VerifyIdentityCommand {
  constructor(
    public readonly gdprDataRequestId: string,
    public readonly verificationMethod: string
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ProcessDataRequestResponse {
  gdprDataRequestId: string;
  status: string;
  processedAt?: string;
  downloadUrl?: string;
  message: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ProcessDataRequestUseCase {
  constructor(
    private readonly gdprRepository: GdprDataRequestRepository,
    private readonly gdprService: GdprService
  ) {}

  /**
   * Verify customer identity before processing
   */
  async verifyIdentity(command: VerifyIdentityCommand): Promise<ProcessDataRequestResponse> {
    const request = await this.gdprRepository.findById(command.gdprDataRequestId);
    if (!request) {
      throw new Error('GDPR request not found');
    }

    request.verifyIdentity(command.verificationMethod);
    await this.gdprRepository.save(request);

    return {
      gdprDataRequestId: request.gdprDataRequestId,
      status: request.status,
      message: 'Identity verified successfully'
    };
  }

  /**
   * Process data export request
   */
  async processExport(command: ProcessExportRequestCommand): Promise<ProcessDataRequestResponse> {
    const request = await this.gdprRepository.findById(command.gdprDataRequestId);
    if (!request) {
      throw new Error('GDPR request not found');
    }

    if (request.requestType !== 'export' && request.requestType !== 'access') {
      throw new Error('This request is not an export request');
    }

    if (!request.identityVerified) {
      throw new Error('Customer identity must be verified before processing');
    }

    // Start processing
    request.startProcessing();
    await this.gdprRepository.save(request);

    try {
      // Export customer data
      const exportedData = await this.gdprService.exportCustomerData(request.customerId);
      
      // In a real implementation, this would:
      // 1. Generate the file in the requested format
      // 2. Upload to secure storage
      // 3. Generate a signed download URL
      
      // For now, we'll simulate with a placeholder
      const downloadUrl = `/gdpr/download/${request.gdprDataRequestId}`;
      
      // Complete the request
      request.completeWithDownload(downloadUrl, command.format, command.adminId);
      await this.gdprRepository.save(request);

      return {
        gdprDataRequestId: request.gdprDataRequestId,
        status: request.status,
        processedAt: request.processedAt?.toISOString(),
        downloadUrl: request.downloadUrl,
        message: 'Export completed successfully. Download link will expire in 7 days.'
      };
    } catch (error) {
      // Handle failure
      throw new Error(`Failed to export data: ${error}`);
    }
  }

  /**
   * Process data deletion request
   */
  async processDeletion(command: ProcessDeletionRequestCommand): Promise<ProcessDataRequestResponse> {
    const request = await this.gdprRepository.findById(command.gdprDataRequestId);
    if (!request) {
      throw new Error('GDPR request not found');
    }

    if (request.requestType !== 'deletion') {
      throw new Error('This request is not a deletion request');
    }

    if (!request.identityVerified) {
      throw new Error('Customer identity must be verified before processing');
    }

    // Start processing
    request.startProcessing();
    await this.gdprRepository.save(request);

    try {
      // Delete or anonymize customer data
      await this.gdprService.anonymizeCustomerData(request.customerId);
      
      // Complete the request
      request.complete(command.adminId, command.notes);
      await this.gdprRepository.save(request);

      return {
        gdprDataRequestId: request.gdprDataRequestId,
        status: request.status,
        processedAt: request.processedAt?.toISOString(),
        message: 'Data deletion completed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete data: ${error}`);
    }
  }

  /**
   * Reject a request
   */
  async reject(command: RejectRequestCommand): Promise<ProcessDataRequestResponse> {
    const request = await this.gdprRepository.findById(command.gdprDataRequestId);
    if (!request) {
      throw new Error('GDPR request not found');
    }

    if (!command.reason?.trim()) {
      throw new Error('Rejection reason is required');
    }

    request.reject(command.adminId, command.reason);
    await this.gdprRepository.save(request);

    return {
      gdprDataRequestId: request.gdprDataRequestId,
      status: request.status,
      processedAt: request.processedAt?.toISOString(),
      message: 'Request rejected'
    };
  }
}
