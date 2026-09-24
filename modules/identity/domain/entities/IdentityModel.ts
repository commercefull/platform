/**
 * Database record types — match the generated libs/db/types schema.
 * Kept in domain so repository ports do not depend on the database layer.
 */

export type IdentityAdminUser = {
  adminId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  permissions: unknown[] | null;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export type Role = {
  roleId: string;
  name: string;
  description: string | null;
  permissions: unknown[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

