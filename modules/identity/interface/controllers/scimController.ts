/**
 * SCIM 2.0 Controller
 *
 * Implements the SCIM 2.0 /Users endpoint for automated user provisioning.
 * Supports: GET (list/get), POST (create), PUT (replace), PATCH (update), DELETE (deactivate).
 *
 * Auth: SCIM bearer token (separate from JWT auth), validated against organization config.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
import { ScimValidationError, ScimResourceNotFoundError, ScimConflictError, ScimAuthenticationError } from '../../domain/errors/SsoErrors';
import type { ManageScimProvisioningUseCase, ScimPatchOperation } from '../../application/useCases/ManageScimProvisioning';

const SCIM_BEARER_TOKEN = process.env.SCIM_BEARER_TOKEN || '';

function scimError(status: number, detail: string, res: HttpResponse): void {
  res.status(status).json({
    schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
    status: status.toString(),
    detail,
  });
}

function validateScimToken(req: HttpRequest): void {
  if (!SCIM_BEARER_TOKEN) {
    throw new ScimAuthenticationError();
  }
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    throw new ScimAuthenticationError();
  }
  const token = auth.slice(7);
  if (token !== SCIM_BEARER_TOKEN) {
    throw new ScimAuthenticationError();
  }
}

interface ScimUser {
  schemas: string[];
  id: string;
  externalId?: string;
  userName: string;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  displayName?: string;
  emails: Array<{ value: string; type: string; primary: boolean }>;
  active: boolean;
  meta: {
    resourceType: string;
    created: string;
    lastModified: string;
  };
}

export class ScimController {
  constructor(private readonly scimUseCase: ManageScimProvisioningUseCase) {}

  /**
   * GET /scim/v2/Users — list provisioned users
   */
  async listUsers(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      validateScimToken(req);
      const organizationId = (req.query.organizationId as string) || '';
      if (!organizationId) {
        throw new ScimValidationError('organizationId query parameter is required');
      }

      const entries = await this.scimUseCase.listUsers(organizationId);
      const resources: ScimUser[] = entries.map(({ record, user }) =>
        this.toScimUser(record.recordId, user, record.isActive, record.createdAt, record.updatedAt, record.externalId),
      );

      res.json({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: resources.length,
        Resources: resources,
        itemsPerPage: resources.length,
        startIndex: 1,
      });
    } catch (error) {
      if (error instanceof ScimAuthenticationError) {
        scimError(401, error.message, res);
      } else if (error instanceof ScimValidationError) {
        scimError(400, error.message, res);
      } else {
        logger.error('SCIM listUsers error', { error: (error as Error).message });
        scimError(500, 'Internal server error', res);
      }
    }
  }

  /**
   * GET /scim/v2/Users/:id — get a single provisioned user
   */
  async getUser(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      validateScimToken(req);
      const { id } = req.params;

      const { record, user } = await this.scimUseCase.getUser(id);
      res.json(this.toScimUser(record.recordId, user, record.isActive, record.createdAt, record.updatedAt, record.externalId));
    } catch (error) {
      if (error instanceof ScimAuthenticationError) {
        scimError(401, error.message, res);
      } else if (error instanceof ScimResourceNotFoundError) {
        scimError(404, error.message, res);
      } else {
        logger.error('SCIM getUser error', { error: (error as Error).message });
        scimError(500, 'Internal server error', res);
      }
    }
  }

  /**
   * POST /scim/v2/Users — provision a new user
   */
  async createUser(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      validateScimToken(req);
      const body = req.body as Record<string, unknown>;
      const organizationId = (req.query.organizationId as string) || (body.organizationId as string) || '';
      if (!organizationId) {
        throw new ScimValidationError('organizationId is required');
      }

      const emails = body.emails as Array<{ value: string; type: string; primary: boolean }> | undefined;
      const email = emails?.find(e => e.primary)?.value || emails?.[0]?.value;
      const name = body.name as { givenName?: string; familyName?: string } | undefined;

      const { record, user } = await this.scimUseCase.provisionUser({
        organizationId,
        email,
        givenName: name?.givenName,
        familyName: name?.familyName,
        displayName: body.displayName as string | undefined,
        active: body.active as boolean | undefined,
        externalId: body.externalId as string | undefined,
      });

      res
        .status(201)
        .json(this.toScimUser(record.scimUserId, user, record.isActive, record.createdAt, record.updatedAt, record.externalId));
    } catch (error) {
      if (error instanceof ScimAuthenticationError) {
        scimError(401, error.message, res);
      } else if (error instanceof ScimValidationError) {
        scimError(400, error.message, res);
      } else if (error instanceof ScimConflictError) {
        scimError(409, error.message, res);
      } else {
        logger.error('SCIM createUser error', { error: (error as Error).message });
        scimError(500, 'Internal server error', res);
      }
    }
  }

  /**
   * PUT /scim/v2/Users/:id — replace a user
   */
  async replaceUser(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      validateScimToken(req);
      const { id } = req.params;
      const body = req.body as Record<string, unknown>;

      const { record: updatedRecord, user, active } = await this.scimUseCase.replaceUser(id, {
        active: body.active as boolean | undefined,
      });

      res.json(
        this.toScimUser(
          updatedRecord.scimUserId,
          user,
          active,
          updatedRecord.createdAt,
          updatedRecord.updatedAt,
          updatedRecord.externalId,
        ),
      );
    } catch (error) {
      if (error instanceof ScimAuthenticationError) {
        scimError(401, error.message, res);
      } else if (error instanceof ScimResourceNotFoundError) {
        scimError(404, error.message, res);
      } else {
        logger.error('SCIM replaceUser error', { error: (error as Error).message });
        scimError(500, 'Internal server error', res);
      }
    }
  }

  /**
   * PATCH /scim/v2/Users/:id — update user attributes
   */
  async patchUser(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      validateScimToken(req);
      const { id } = req.params;
      const body = req.body as Record<string, unknown>;

      const operations = body.Operations as ScimPatchOperation[] | undefined;
      await this.scimUseCase.patchUser(id, operations);

      res.status(204).send();
    } catch (error) {
      if (error instanceof ScimAuthenticationError) {
        scimError(401, error.message, res);
      } else if (error instanceof ScimResourceNotFoundError) {
        scimError(404, error.message, res);
      } else {
        logger.error('SCIM patchUser error', { error: (error as Error).message });
        scimError(500, 'Internal server error', res);
      }
    }
  }

  /**
   * DELETE /scim/v2/Users/:id — deprovision a user
   */
  async deleteUser(req: HttpRequest, res: HttpResponse): Promise<void> {
    try {
      validateScimToken(req);
      const { id } = req.params;

      await this.scimUseCase.deprovisionUser(id);

      res.status(204).send();
    } catch (error) {
      if (error instanceof ScimAuthenticationError) {
        scimError(401, error.message, res);
      } else if (error instanceof ScimResourceNotFoundError) {
        scimError(404, error.message, res);
      } else {
        logger.error('SCIM deleteUser error', { error: (error as Error).message });
        scimError(500, 'Internal server error', res);
      }
    }
  }

  private toScimUser(
    scimUserId: string,
    user: { id: string; email: string; name?: string; firstName?: string; lastName?: string; isActive: boolean },
    active: boolean,
    createdAt: Date,
    updatedAt: Date,
    externalId?: string,
  ): ScimUser {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      id: scimUserId,
      externalId,
      userName: user.email,
      name: {
        givenName: user.firstName,
        familyName: user.lastName,
      },
      displayName: user.name,
      emails: [{ value: user.email, type: 'work', primary: true }],
      active: active && user.isActive,
      meta: {
        resourceType: 'User',
        created: createdAt.toISOString(),
        lastModified: updatedAt.toISOString(),
      },
    };
  }
}
