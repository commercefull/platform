/**
 * Create GDPR Data Request Use Case
 */

import { generateUUID } from '../../../../libs/uuid';
import { GdprDataRequestRepository } from '../../domain/repositories/GdprRepository';
import { GdprDataRequest, GdprRequestType } from '../../domain/entities/GdprDataRequest';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class CreateDataRequestCommand {
  constructor(
    public readonly customerId: string,
    public readonly requestType: GdprRequestType,
    public readonly reason?: string,
    public readonly requestedData?: string[],
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CreateDataRequestResponse {
  gdprDataRequestId: string;
  requestType: GdprRequestType;
  status: string;
  deadlineAt: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreateDataRequestUseCase {
  constructor(private readonly gdprRepository: GdprDataRequestRepository) {}

  async execute(command: CreateDataRequestCommand): Promise<CreateDataRequestResponse> {
    // Validate
    if (!command.customerId?.trim()) {
      throw new Error('Customer ID is required');
    }
    if (!command.requestType) {
      throw new Error('Request type is required');
    }

    // Check for existing pending request of same type
    const existingRequests = await this.gdprRepository.findByCustomerId(command.customerId);
    const hasPendingRequest = existingRequests.some(
      r => r.requestType === command.requestType && ['pending', 'processing'].includes(r.status),
    );

    if (hasPendingRequest) {
      throw new Error(`You already have a pending ${command.requestType} request`);
    }

    // Create the request
    const request = GdprDataRequest.create({
      gdprDataRequestId: generateUUID(),
      customerId: command.customerId,
      requestType: command.requestType,
      reason: command.reason,
      requestedData: command.requestedData,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
    });

    // Save
    await this.gdprRepository.save(request);

    // Emit event
    eventBus.emit('gdpr.request.created', {
      gdprDataRequestId: request.gdprDataRequestId,
      customerId: request.customerId,
      requestType: request.requestType,
      deadlineAt: request.deadlineAt.toISOString(),
    });

    return {
      gdprDataRequestId: request.gdprDataRequestId,
      requestType: request.requestType,
      status: request.status,
      deadlineAt: request.deadlineAt.toISOString(),
      createdAt: request.createdAt.toISOString(),
    };
  }
}
