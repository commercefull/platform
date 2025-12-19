/**
 * Users Controller
 * Handles admin user management, roles, and permissions
 * for the CommerceFull Admin Hub - Phase 8
 */

import { Request, Response } from 'express';
import { query, queryOne } from '../../../libs/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// ============================================================================
// Types
// ============================================================================

interface AdminUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType: 'admin';
  status: 'active' | 'inactive' | 'suspended';
  roleId?: string;
  roleName?: string;
  lastLoginAt?: Date;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Role {
  roleId: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Admin Users Management
// ============================================================================

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, role, page = '1' } = req.query;
    const limit = 20;
    const offset = (parseInt(page as string) - 1) * limit;

    let whereClause = `WHERE "userType" = 'admin'`;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND "status" = $${paramIndex++}`;
      params.push(status);
    }

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "user" ${whereClause}`,
      params
    );

    // Get users
    const users = await query<Array<any>>(
      `SELECT u.*, r."name" as "roleName"
       FROM "user" u
       LEFT JOIN "adminUserRole" aur ON u."userId" = aur."userId"
       LEFT JOIN "role" r ON aur."roleId" = r."roleId"
       ${whereClause}
       ORDER BY u."createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    // Get roles for filter dropdown
    const roles = await query<Array<Role>>(
      `SELECT * FROM "role" ORDER BY "name"`
    );

    const total = parseInt(countResult?.count || '0');

    res.render('hub/views/users/index', {
      pageName: 'Admin Users',
      users: users || [],
      roles: roles || [],
      total,
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(total / limit),
      filters: { status, role },
      user: req.user
    });
  } catch (error: any) {
    console.error('Error listing users:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load users',
      user: req.user
    });
  }
};

export const viewUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await queryOne<any>(
      `SELECT u.*, r."name" as "roleName", r."roleId"
       FROM "user" u
       LEFT JOIN "adminUserRole" aur ON u."userId" = aur."userId"
       LEFT JOIN "role" r ON aur."roleId" = r."roleId"
       WHERE u."userId" = $1`,
      [userId]
    );

    if (!user) {
      res.status(404).render('hub/views/error', {
        pageName: 'Not Found',
        error: 'User not found',
        user: req.user
      });
      return;
    }

    // Get user's permissions through role
    let permissions: string[] = [];
    if (user.roleId) {
      const role = await queryOne<Role>(
        `SELECT * FROM "role" WHERE "roleId" = $1`,
        [user.roleId]
      );
      permissions = role?.permissions || [];
    }

    // Get available roles
    const roles = await query<Array<Role>>(
      `SELECT * FROM "role" ORDER BY "name"`
    );

    res.render('hub/views/users/view', {
      pageName: 'User Details',
      adminUser: user,
      permissions,
      roles: roles || [],
      user: req.user
    });
  } catch (error: any) {
    console.error('Error viewing user:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load user',
      user: req.user
    });
  }
};

export const createUserForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await query<Array<Role>>(
      `SELECT * FROM "role" ORDER BY "name"`
    );

    res.render('hub/views/users/create', {
      pageName: 'Create Admin User',
      roles: roles || [],
      user: req.user
    });
  } catch (error: any) {
    console.error('Error loading create user form:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
      user: req.user
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, roleId } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    // Check if email already exists
    const existing = await queryOne<{ userId: string }>(
      `SELECT "userId" FROM "user" WHERE "email" = $1`,
      [email.toLowerCase()]
    );

    if (existing) {
      res.status(400).json({ success: false, message: 'Email already exists' });
      return;
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    await query(
      `INSERT INTO "user" (
        "userId", "email", "passwordHash", "userType", "status",
        "firstName", "lastName", "emailVerified", "phoneVerified",
        "mfaEnabled", "loginCount", "failedLoginAttempts", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        userId,
        email.toLowerCase(),
        passwordHash,
        'admin',
        'active',
        firstName || null,
        lastName || null,
        true,
        false,
        false,
        0,
        0,
        now,
        now
      ]
    );

    // Assign role if provided
    if (roleId) {
      await query(
        `INSERT INTO "adminUserRole" ("userId", "roleId", "createdAt")
         VALUES ($1, $2, $3)`,
        [userId, roleId, now]
      );
    }

    res.json({ success: true, userId });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, status, roleId } = req.body;
    const now = new Date();

    await query(
      `UPDATE "user" SET
        "firstName" = COALESCE($1, "firstName"),
        "lastName" = COALESCE($2, "lastName"),
        "status" = COALESCE($3, "status"),
        "updatedAt" = $4
       WHERE "userId" = $5`,
      [firstName, lastName, status, now, userId]
    );

    // Update role assignment
    if (roleId !== undefined) {
      await query(`DELETE FROM "adminUserRole" WHERE "userId" = $1`, [userId]);
      if (roleId) {
        await query(
          `INSERT INTO "adminUserRole" ("userId", "roleId", "createdAt")
           VALUES ($1, $2, $3)`,
          [userId, roleId, now]
        );
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Don't allow deleting yourself
    if ((req as any).user?.userId === userId) {
      res.status(400).json({ success: false, message: 'Cannot delete your own account' });
      return;
    }

    await query(`DELETE FROM "adminUserRole" WHERE "userId" = $1`, [userId]);
    await query(`DELETE FROM "user" WHERE "userId" = $1 AND "userType" = 'admin'`, [userId]);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Roles Management
// ============================================================================

export const listRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await query<Array<any>>(
      `SELECT r.*, 
        (SELECT COUNT(*) FROM "adminUserRole" aur WHERE aur."roleId" = r."roleId") as "userCount"
       FROM "role" r
       ORDER BY r."name"`
    );

    res.render('hub/views/users/roles', {
      pageName: 'Roles & Permissions',
      roles: roles || [],
      availablePermissions: AVAILABLE_PERMISSIONS,
      user: req.user
    });
  } catch (error: any) {
    console.error('Error listing roles:', error);
    res.status(500).render('hub/views/error', {
      pageName: 'Error',
      error: error.message || 'Failed to load roles',
      user: req.user
    });
  }
};

export const createRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Role name is required' });
      return;
    }

    const roleId = uuidv4();
    const now = new Date();

    await query(
      `INSERT INTO "role" ("roleId", "name", "description", "permissions", "isSystem", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        roleId,
        name,
        description || null,
        JSON.stringify(permissions || []),
        false,
        now,
        now
      ]
    );

    res.json({ success: true, roleId });
  } catch (error: any) {
    console.error('Error creating role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roleId } = req.params;
    const { name, description, permissions } = req.body;
    const now = new Date();

    // Check if system role
    const role = await queryOne<Role>(
      `SELECT * FROM "role" WHERE "roleId" = $1`,
      [roleId]
    );

    if (role?.isSystem) {
      res.status(400).json({ success: false, message: 'Cannot modify system roles' });
      return;
    }

    await query(
      `UPDATE "role" SET
        "name" = COALESCE($1, "name"),
        "description" = COALESCE($2, "description"),
        "permissions" = COALESCE($3, "permissions"),
        "updatedAt" = $4
       WHERE "roleId" = $5`,
      [name, description, permissions ? JSON.stringify(permissions) : null, now, roleId]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roleId } = req.params;

    // Check if system role
    const role = await queryOne<Role>(
      `SELECT * FROM "role" WHERE "roleId" = $1`,
      [roleId]
    );

    if (role?.isSystem) {
      res.status(400).json({ success: false, message: 'Cannot delete system roles' });
      return;
    }

    // Check if role is in use
    const usageCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "adminUserRole" WHERE "roleId" = $1`,
      [roleId]
    );

    if (parseInt(usageCount?.count || '0') > 0) {
      res.status(400).json({ success: false, message: 'Cannot delete role that is assigned to users' });
      return;
    }

    await query(`DELETE FROM "role" WHERE "roleId" = $1`, [roleId]);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Available Permissions
// ============================================================================

const AVAILABLE_PERMISSIONS = [
  // Dashboard
  { key: 'dashboard.view', name: 'View Dashboard', category: 'Dashboard' },

  // Products
  { key: 'products.view', name: 'View Products', category: 'Products' },
  { key: 'products.create', name: 'Create Products', category: 'Products' },
  { key: 'products.edit', name: 'Edit Products', category: 'Products' },
  { key: 'products.delete', name: 'Delete Products', category: 'Products' },

  // Orders
  { key: 'orders.view', name: 'View Orders', category: 'Orders' },
  { key: 'orders.edit', name: 'Edit Orders', category: 'Orders' },
  { key: 'orders.refund', name: 'Process Refunds', category: 'Orders' },

  // Customers
  { key: 'customers.view', name: 'View Customers', category: 'Customers' },
  { key: 'customers.edit', name: 'Edit Customers', category: 'Customers' },
  { key: 'customers.delete', name: 'Delete Customers', category: 'Customers' },

  // Analytics
  { key: 'analytics.view', name: 'View Analytics', category: 'Analytics' },
  { key: 'analytics.export', name: 'Export Reports', category: 'Analytics' },

  // Settings
  { key: 'settings.view', name: 'View Settings', category: 'Settings' },
  { key: 'settings.edit', name: 'Edit Settings', category: 'Settings' },

  // Users
  { key: 'users.view', name: 'View Admin Users', category: 'Users' },
  { key: 'users.create', name: 'Create Admin Users', category: 'Users' },
  { key: 'users.edit', name: 'Edit Admin Users', category: 'Users' },
  { key: 'users.delete', name: 'Delete Admin Users', category: 'Users' },

  // Roles
  { key: 'roles.view', name: 'View Roles', category: 'Roles' },
  { key: 'roles.manage', name: 'Manage Roles', category: 'Roles' }
];

export { AVAILABLE_PERMISSIONS };
