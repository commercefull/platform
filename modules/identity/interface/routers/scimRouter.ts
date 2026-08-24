/**
 * SCIM 2.0 Router
 *
 * Routes for SCIM user provisioning endpoints.
 * Uses SCIM bearer token auth (separate from JWT auth).
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { ScimController } from '../controllers/scimController';
import { ScimProvisioningRepositoryImpl } from '../../infrastructure/repositories/ScimProvisioningRepositoryImpl';
import { OrganizationCredentialSubjectAdapter } from '../../infrastructure/acl/OrganizationCredentialSubjectAdapter';

const provisioningRepo = new ScimProvisioningRepositoryImpl();
const orgPort = new OrganizationCredentialSubjectAdapter();
const scimController = new ScimController(provisioningRepo, orgPort);

const router = Router();

// SCIM 2.0 /Users endpoints
router.get('/scim/v2/Users', asyncHandler(scimController.listUsers.bind(scimController)));
router.get('/scim/v2/Users/:id', asyncHandler(scimController.getUser.bind(scimController)));
router.post('/scim/v2/Users', asyncHandler(scimController.createUser.bind(scimController)));
router.put('/scim/v2/Users/:id', asyncHandler(scimController.replaceUser.bind(scimController)));
router.patch('/scim/v2/Users/:id', asyncHandler(scimController.patchUser.bind(scimController)));
router.delete('/scim/v2/Users/:id', asyncHandler(scimController.deleteUser.bind(scimController)));

export const scimRouter = router;
