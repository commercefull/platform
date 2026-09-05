/**
 * SSO Business Controller
 *
 * Manages SAML/OIDC provider configurations and handles SSO login flows.
 * Config routes require organization auth. SSO login routes are public.
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../../libs/logger';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import {
  manageSamlUseCase,
  manageOidcUseCase,
  ssoLoginUseCase,
  listProvidersUseCase,
} from '../../application/wired';

class SsoController {
  // ── List Providers ────────────────────────────────────────────

  async listProviders(req: TypedRequest, res: Response) {
    try {
      const organizationId = (req as unknown as { user?: { id?: string } }).user?.id;
      if (!organizationId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const providers = await listProvidersUseCase.execute(organizationId);
      res.json({ success: true, data: providers });
    } catch (error) {
      logger.error('Error listing SSO providers:', error);
      res.status(500).json({ success: false, message: 'Failed to list SSO providers' });
    }
  }

  // ── SAML Config CRUD ──────────────────────────────────────────

  async createSamlProvider(req: TypedRequest, res: Response) {
    try {
      const organizationId = (req as unknown as { user?: { id?: string } }).user?.id;
      if (!organizationId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const body = req.body as Record<string, unknown>;
      const provider = await manageSamlUseCase.create({
        organizationId,
        name: body.name as string,
        entityId: body.entityId as string,
        ssoUrl: body.ssoUrl as string,
        certificate: body.certificate as string,
        spEntityId: body.spEntityId as string,
        acsUrl: body.acsUrl as string,
        binding: body.binding as 'redirect' | 'post' | undefined,
        nameIdFormat: body.nameIdFormat as 'unspecified' | 'emailAddress' | 'persistent' | 'transient' | undefined,
        signAuthnRequest: body.signAuthnRequest as boolean | undefined,
        sloUrl: body.sloUrl as string | undefined,
        spPrivateKey: body.spPrivateKey as string | undefined,
        spCertificate: body.spCertificate as string | undefined,
        attributeMapping: body.attributeMapping as Record<string, string> | undefined,
      });
      res.status(201).json({ success: true, data: provider.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async updateSamlProvider(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const body = req.body as Record<string, unknown>;
      const provider = await manageSamlUseCase.update(providerId, {
        name: body.name as string | undefined,
        entityId: body.entityId as string | undefined,
        ssoUrl: body.ssoUrl as string | undefined,
        sloUrl: body.sloUrl as string | undefined,
        certificate: body.certificate as string | undefined,
        spEntityId: body.spEntityId as string | undefined,
        acsUrl: body.acsUrl as string | undefined,
        binding: body.binding as 'redirect' | 'post' | undefined,
        nameIdFormat: body.nameIdFormat as 'unspecified' | 'emailAddress' | 'persistent' | 'transient' | undefined,
        signAuthnRequest: body.signAuthnRequest as boolean | undefined,
      });
      res.json({ success: true, data: provider.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async getSamlProvider(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const provider = await manageSamlUseCase.getById(providerId);
      if (!provider) {
        res.status(404).json({ success: false, message: 'SAML provider not found' });
        return;
      }
      res.json({ success: true, data: provider.toJSON() });
    } catch (error) {
      logger.error('Error getting SAML provider:', error);
      res.status(500).json({ success: false, message: 'Failed to get SAML provider' });
    }
  }

  async deleteSamlProvider(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      await manageSamlUseCase.delete(providerId);
      res.json({ success: true, message: 'SAML provider deleted' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async activateSamlProvider(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const provider = await manageSamlUseCase.activate(providerId);
      res.json({ success: true, data: provider.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async deactivateSamlProvider(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const provider = await manageSamlUseCase.deactivate(providerId);
      res.json({ success: true, data: provider.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  // ── OIDC Config CRUD ──────────────────────────────────────────

  async createOidcProvider(req: TypedRequest, res: Response) {
    try {
      const organizationId = (req as unknown as { user?: { id?: string } }).user?.id;
      if (!organizationId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const body = req.body as Record<string, unknown>;
      const provider = await manageOidcUseCase.create({
        organizationId,
        name: body.name as string,
        issuerUrl: body.issuerUrl as string,
        clientId: body.clientId as string,
        clientSecret: body.clientSecret as string,
        scopes: body.scopes as string[] | undefined,
        redirectUri: body.redirectUri as string,
        usePkce: body.usePkce as boolean | undefined,
        useDiscovery: body.useDiscovery as boolean | undefined,
        authorizationEndpoint: body.authorizationEndpoint as string | undefined,
        tokenEndpoint: body.tokenEndpoint as string | undefined,
        userinfoEndpoint: body.userinfoEndpoint as string | undefined,
        jwksUri: body.jwksUri as string | undefined,
        claimMapping: body.claimMapping as Record<string, string> | undefined,
      });
      res.status(201).json({ success: true, data: provider.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async updateOidcProvider(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const body = req.body as Record<string, unknown>;
      const provider = await manageOidcUseCase.update(providerId, {
        name: body.name as string | undefined,
        issuerUrl: body.issuerUrl as string | undefined,
        clientId: body.clientId as string | undefined,
        clientSecret: body.clientSecret as string | undefined,
        scopes: body.scopes as string[] | undefined,
        redirectUri: body.redirectUri as string | undefined,
        usePkce: body.usePkce as boolean | undefined,
        useDiscovery: body.useDiscovery as boolean | undefined,
        authorizationEndpoint: body.authorizationEndpoint as string | undefined,
        tokenEndpoint: body.tokenEndpoint as string | undefined,
        userinfoEndpoint: body.userinfoEndpoint as string | undefined,
        jwksUri: body.jwksUri as string | undefined,
      });
      res.json({ success: true, data: provider.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async getOidcProvider(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const provider = await manageOidcUseCase.getById(providerId);
      if (!provider) {
        res.status(404).json({ success: false, message: 'OIDC provider not found' });
        return;
      }
      res.json({ success: true, data: provider.toJSON() });
    } catch (error) {
      logger.error('Error getting OIDC provider:', error);
      res.status(500).json({ success: false, message: 'Failed to get OIDC provider' });
    }
  }

  async deleteOidcProvider(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      await manageOidcUseCase.delete(providerId);
      res.json({ success: true, message: 'OIDC provider deleted' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async activateOidcProvider(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const provider = await manageOidcUseCase.activate(providerId);
      res.json({ success: true, data: provider.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async deactivateOidcProvider(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const provider = await manageOidcUseCase.deactivate(providerId);
      res.json({ success: true, data: provider.toJSON() });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  // ── SSO Login Flows (public) ──────────────────────────────────

  async initiateSamlLogin(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const result = await ssoLoginUseCase.initiateSamlAsync(providerId);
      res.json({ success: true, redirectUrl: result.redirectUrl, requestId: result.requestId });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async samlCallback(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const body = req.body as Record<string, unknown>;
      const samlResponse = (body.SAMLResponse as string) || (req.query.SAMLResponse as string);
      if (!samlResponse) {
        res.status(400).json({ success: false, message: 'SAMLResponse is required' });
        return;
      }
      const result = await ssoLoginUseCase.handleSamlCallback(providerId, samlResponse, req.ip);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async initiateOidcLogin(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const result = await ssoLoginUseCase.initiateOidc(providerId);
      res.json({ success: true, authUrl: result.authUrl, state: result.state });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async oidcCallback(req: TypedRequest, res: Response) {
    try {
      const { providerId } = req.params;
      const body = req.body as Record<string, unknown>;
      const code = (body.code as string) || (req.query.code as string);
      const codeVerifier = body.codeVerifier as string | undefined;
      if (!code) {
        res.status(400).json({ success: false, message: 'Authorization code is required' });
        return;
      }
      const result = await ssoLoginUseCase.handleOidcCallback(providerId, code, codeVerifier, req.ip);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }
}

export const ssoController = new SsoController();
