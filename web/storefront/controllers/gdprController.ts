/**
 * Storefront GDPR Controller
 * Handles GDPR data request views for customers
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import { createDataRequestUseCase, manageGdprRequestsUseCase } from '../../../modules/gdpr/application/useCases/wired';
import { CreateDataRequestCommand } from '../../../modules/gdpr/application/useCases/CreateDataRequest';
import type { GdprRequestType } from '../../../modules/gdpr/domain/entities/GdprDataRequest';

interface CustomerUser {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
}

const VALID_TYPES: GdprRequestType[] = ['access', 'export', 'deletion', 'rectification', 'objection', 'restriction'];

const REQUEST_TYPE_LABELS: Record<string, string> = {
  access: 'Access My Data',
  export: 'Export My Data',
  deletion: 'Delete My Data',
  rectification: 'Correct My Data',
  objection: 'Object to Processing',
  restriction: 'Restrict Processing',
};

const REQUEST_TYPE_DESCRIPTIONS: Record<string, string> = {
  access: 'Request a copy of all personal data we hold about you (GDPR Article 15).',
  export: 'Receive your personal data in a portable format (GDPR Article 20).',
  deletion: 'Request erasure of your personal data (GDPR Article 17).',
  rectification: 'Request correction of inaccurate personal data (GDPR Article 16).',
  objection: 'Object to the processing of your personal data (GDPR Article 21).',
  restriction: 'Request restriction of processing (GDPR Article 18).',
};

/**
 * GET: List customer's GDPR data requests
 */
export const listRequests = async (req: TypedRequest, res: Response): Promise<void> => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin?redirect=/gdpr/requests');
  }

  const requests = await manageGdprRequestsUseCase.findByCustomerId(user.customerId);
  const requestData = requests.map(r => r.toJSON());

  storefrontRespond(req, res, 'gdpr/requests', {
    pageName: 'My Data Requests',
    requests: requestData,
  });
  
};

/**
 * GET: View a single GDPR data request
 */
export const viewRequest = async (req: TypedRequest, res: Response): Promise<void> => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin?redirect=/gdpr/requests');
  }

  const request = await manageGdprRequestsUseCase.findById(req.params.gdprDataRequestId);
  if (!request || request.customerId !== user.customerId) {
    return storefrontRespond(req, res, '404', {
      pageName: 'Request Not Found',
    });
  }

  storefrontRespond(req, res, 'gdpr/request-detail', {
    pageName: `Data Request — ${REQUEST_TYPE_LABELS[request.requestType] || request.requestType}`,
    request: request.toJSON(),
    requestTypeLabel: REQUEST_TYPE_LABELS[request.requestType] || request.requestType,
  });
  
};

/**
 * GET: Create data request form
 */
export const createRequestForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const user = req.user as CustomerUser;
  if (!user?.customerId) {
    return res.redirect('/signin?redirect=/gdpr/requests/new');
  }

  const requestType = req.query.type as string | undefined;

  storefrontRespond(req, res, 'gdpr/create-request', {
    pageName: 'New Data Request',
    formData: {},
    requestType: requestType && VALID_TYPES.includes(requestType as GdprRequestType) ? requestType : '',
    requestTypeLabels: REQUEST_TYPE_LABELS,
    requestTypeDescriptions: REQUEST_TYPE_DESCRIPTIONS,
  });
  
};

/**
 * POST: Submit a new GDPR data request
 */
export const createRequestSubmit = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin?redirect=/gdpr/requests/new');
    }

    const body = req.body as RequestBody;
    const { requestType, reason, requestedData } = body;

    if (!requestType || !VALID_TYPES.includes(requestType as GdprRequestType)) {
      return storefrontRespond(req, res, 'gdpr/create-request', {
        pageName: 'New Data Request',
        error: 'Please select a valid request type',
        formData: req.body as RequestBody,
        requestType: '',
        requestTypeLabels: REQUEST_TYPE_LABELS,
        requestTypeDescriptions: REQUEST_TYPE_DESCRIPTIONS,
      });
    }

    const command = new CreateDataRequestCommand(
      user.customerId,
      requestType as GdprRequestType,
      (reason as string) || '',
      requestedData as string[] | undefined,
      req.ip,
      req.get('User-Agent'),
    );

    const result = await createDataRequestUseCase.execute(command);

    res.redirect(`/gdpr/requests/${result.gdprDataRequestId}?success=Your data request has been submitted`);
  } catch (error: unknown) {
    logger.warn('Error creating GDPR request:', error);
    storefrontRespond(req, res, 'gdpr/create-request', {
      pageName: 'New Data Request',
      error: (error as Error).message || 'Failed to create request',
      formData: req.body as RequestBody,
      requestType: (req.body as RequestBody).requestType as string || '',
      requestTypeLabels: REQUEST_TYPE_LABELS,
      requestTypeDescriptions: REQUEST_TYPE_DESCRIPTIONS,
    });
  }
};

/**
 * POST: Cancel a GDPR data request
 */
export const cancelRequest = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user as CustomerUser;
    if (!user?.customerId) {
      return res.redirect('/signin?redirect=/gdpr/requests');
    }

    const request = await manageGdprRequestsUseCase.findById(req.params.gdprDataRequestId);
    if (!request || request.customerId !== user.customerId) {
      req.flash('error', 'Request not found');
      return res.redirect('/gdpr/requests');
    }

    request.cancel();
    await manageGdprRequestsUseCase.save(request);

    req.flash('success', 'Your data request has been cancelled');
    res.redirect('/gdpr/requests');
  } catch (error: unknown) {
    logger.warn('Error cancelling GDPR request:', error);
    req.flash('error', (error as Error).message || 'Failed to cancel request');
    res.redirect('/gdpr/requests');
  }
};
