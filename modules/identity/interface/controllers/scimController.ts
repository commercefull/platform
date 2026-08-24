/**
 * SCIM 2.0 Controller
 *
 * Implements the SCIM 2.0 /Users endpoint for automated user provisioning.
 * Supports: GET (list/get), POST (create), PUT (replace), PATCH (update), DELETE (deactivate).
 *
 * Auth: SCIM bearer token (separate from JWT auth), validated against organization config.
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { generateUUID } from '../../../../libs/uuid';
import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';
import { ScimProvisioningRepository } from '../../domain/repositories/SsoProviderRepository';
import { ScimValidationError, ScimResourceNotFoundError, ScimConflictError, ScimAuthenticationError } from '../../domain/errors/SsoErrors';
import type { CredentialSubjectPort } from '../../application/ports/CredentialSubjectPort';

const SCIM_BEARER_TOKEN = process.env.SCIM_BEARER_TOKEN || '';

function scimError(status: number, detail: string, res: Response): void {
  res.status(status).json({
    schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
    status: status.toString(),
    detail,
  });
}

function validateScimToken(req: TypedRequest): void {
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
  constructor(
    private readonly provisioningRepo: ScimProvisioningRepository,
    private readonly credentialPort: CredentialSubjectPort,
  ) {}

  /**
   * GET /scim/v2/Users — list provisioned users
   */
  async listUsers(req: TypedRequest, res: Response): Promise<void> {
    try {
      validateScimToken(req);
      const organizationId = (req.query.organizationId as string) || '';
      if (!organizationId) {
        throw new ScimValidationError('organizationId query parameter is required');
      }

      const records = await this.provisioningRepo.findByOrganizationId(organizationId);
      const resources: ScimUser[] = [];

      for (const record of records) {
        const user = await this.credentialPort.findById(record.userId);
        if (user) {
          resources.push(this.toScimUser(record.recordId, user, record.isActive, record.createdAt, record.updatedAt, record.externalId));
        }
      }

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
  async getUser(req: TypedRequest, res: Response): Promise<void> {
    try {
      validateScimToken(req);
      const { id } = req.params;

      const record = await this.provisioningRepo.findByScimUserId(id);
      if (!record) {
        throw new ScimResourceNotFoundError('User', id);
      }

      const user = await this.credentialPort.findById(record.userId);
      if (!user) {
        throw new ScimResourceNotFoundError('User', id);
      }

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
  async createUser(req: TypedRequest, res: Response): Promise<void> {
    try {
      validateScimToken(req);
      const body = req.body as Record<string, unknown>;
      const organizationId = (req.query.organizationId as string) || (body.organizationId as string) || '';
      if (!organizationId) {
        throw new ScimValidationError('organizationId is required');
      }

      const emails = body.emails as Array<{ value: string; type: string; primary: boolean }> | undefined;
      const email = emails?.find(e => e.primary)?.value || emails?.[0]?.value;
      if (!email) {
        throw new ScimValidationError('At least one email is required');
      }

      // Check if user already exists
      const existing = await this.credentialPort.findByEmail(email);
      if (existing) {
        // Check if already provisioned
        const existingRecord = await this.provisioningRepo.findByUserId(existing.id);
        if (existingRecord) {
          throw new ScimConflictError(`User with email ${email} already provisioned`);
        }
      }

      const name = body.name as { givenName?: string; familyName?: string } | undefined;
      const displayName = body.displayName as string | undefined;
      const active = body.active as boolean | undefined ?? true;
      const externalId = body.externalId as string | undefined;

      // Create or find user
      let userId: string;
      let isNewUser = false;

      if (existing) {
        userId = existing.id;
      } else {
        const created = await this.credentialPort.createWithPassword({
          email,
          password: '',
          firstName: name?.givenName || '',
          lastName: name?.familyName || '',
          name: displayName,
          isActive: active,
          isVerified: true,
        });
        userId = created.id;
        isNewUser = true;
      }

      // Create provisioning record
      const scimUserId = generateUUID();
      const now = new Date();
      const record = await this.provisioningRepo.save({
        recordId: generateUUID(),
        organizationId,
        userId,
        userType: 'organization',
        scimUserId,
        externalId,
        source: 'scim',
        isActive: active,
        createdAt: now,
        updatedAt: now,
      });

      const user = await this.credentialPort.findById(userId);
      if (!user) {
        throw new ScimResourceNotFoundError('User', userId);
      }

      eventBus.emit('identity.scim.user_provisioned', {
        userId,
        organizationId,
        scimUserId,
        email,
        isNewUser,
        timestamp: now,
      });

      res.status(201).json(this.toScimUser(record.scimUserId, user, record.isActive, record.createdAt, record.updatedAt, record.externalId));
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
  async replaceUser(req: TypedRequest, res: Response): Promise<void> {
    try {
      validateScimToken(req);
      const { id } = req.params;
      const body = req.body as Record<string, unknown>;

      const record = await this.provisioningRepo.findByScimUserId(id);
      if (!record) {
        throw new ScimResourceNotFoundError('User', id);
      }

      const user = await this.credentialPort.findById(record.userId);
      if (!user) {
        throw new ScimResourceNotFoundError('User', id);
      }

      const active = body.active as boolean | undefined ?? true;
      if (!active && record.isActive) {
        await this.provisioningRepo.deactivate(record.recordId);
      }

      eventBus.emit('identity.scim.user_updated', {
        userId: record.userId,
        scimUserId: id,
        active,
        timestamp: new Date(),
      });

      const updatedRecord = await this.provisioningRepo.findByScimUserId(id);
      res.json(this.toScimUser(
        updatedRecord!.scimUserId,
        user,
        active,
        updatedRecord!.createdAt,
        updatedRecord!.updatedAt,
        updatedRecord!.externalId,
      ));
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
  async patchUser(req: TypedRequest, res: Response): Promise<void> {
    try {
      validateScimToken(req);
      const { id } = req.params;
      const body = req.body as Record<string, unknown>;

      const record = await this.provisioningRepo.findByScimUserId(id);
      if (!record) {
        throw new ScimResourceNotFoundError('User', id);
      }

      // SCIM PATCH operations
      const operations = body.Operations as Array<{ op: string; path?: string; value: unknown }> | undefined;
      if (operations) {
        for (const op of operations) {
          if (op.op.toLowerCase() === 'replace' && op.path === 'active') {
            const active = op.value as boolean;
            if (!active && record.isActive) {
              await this.provisioningRepo.deactivate(record.recordId);
            }
          }
        }
      }

      eventBus.emit('identity.scim.user_updated', {
        userId: record.userId,
        scimUserId: id,
        timestamp: new Date(),
      });

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
  async deleteUser(req: TypedRequest, res: Response): Promise<void> {
    try {
      validateScimToken(req);
      const { id } = req.params;

      const record = await this.provisioningRepo.findByScimUserId(id);
      if (!record) {
        throw new ScimResourceNotFoundError('User', id);
      }

      await this.provisioningRepo.deactivate(record.recordId);

      eventBus.emit('identity.scim.user_deprovisioned', {
        userId: record.userId,
        scimUserId: id,
        organizationId: record.organizationId,
        timestamp: new Date(),
      });

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
