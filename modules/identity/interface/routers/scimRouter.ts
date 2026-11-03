/**
 * SCIM 2.0 Router
 *
 * Routes for SCIM user provisioning endpoints.
 * Uses SCIM bearer token auth (separate from JWT auth).
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { ScimController } from '../controllers/scimController';
import { manageScimProvisioningUseCase } from '../../application/wired';
const scimController = new ScimController(manageScimProvisioningUseCase);

const router = createHttpRouter();

// SCIM 2.0 /Users endpoints
router.get('/scim/v2/Users', asyncHandler(scimController.listUsers));
router.get('/scim/v2/Users/:id', asyncHandler(scimController.getUser));
router.post('/scim/v2/Users', asyncHandler(scimController.createUser));
router.put('/scim/v2/Users/:id', asyncHandler(scimController.replaceUser));
router.patch('/scim/v2/Users/:id', asyncHandler(scimController.patchUser));
router.delete('/scim/v2/Users/:id', asyncHandler(scimController.deleteUser));

export const scimRouter = router;
