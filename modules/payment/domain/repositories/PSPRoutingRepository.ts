/**
 * PSP Routing Repository Port
 *
 * Provides access to payment provider route configurations for the failover engine.
 */

import { PSPRoute } from '../entities/PSPRoute';

export interface PSPRoutingRepository {
  /** Find all active routes for an organization, ordered by priority */
  findActiveRoutes(organizationId: string): Promise<PSPRoute[]>;

  /** Find all routes (active and inactive) for an organization */
  findAllRoutes(organizationId: string): Promise<PSPRoute[]>;

  /** Find a specific route by ID */
  findRouteById(routeId: string): Promise<PSPRoute | null>;

  /** Create a new route */
  createRoute(route: PSPRoute): Promise<PSPRoute>;

  /** Update an existing route */
  updateRoute(routeId: string, updates: Partial<PSPRoute>): Promise<PSPRoute | null>;

  /** Delete a route */
  deleteRoute(routeId: string): Promise<boolean>;

  /** Activate a route */
  activateRoute(routeId: string): Promise<PSPRoute | null>;

  /** Deactivate a route */
  deactivateRoute(routeId: string): Promise<PSPRoute | null>;
}
