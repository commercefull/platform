import type { B2BUser as DbB2bUser } from '../../../../libs/db/types';
import { query, queryOne } from '../../../../libs/db';
import { B2BUser, B2BUserProps } from '../../domain/entities/B2BUser';
import type { B2BUserRepository } from '../../domain/repositories/B2BRepository';

function rowToProps(row: DbB2bUser): B2BUserProps {
  return {
    ...row,
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    role: row.role as B2BUserProps['role'],
    status: row.status as B2BUserProps['status'],
    spendingLimits: row.spendingLimits as B2BUserProps['spendingLimits'],
    department: row.department ?? undefined,
    costCenter: row.costCenter ?? undefined,
    activatedAt: row.activatedAt ?? undefined,
    lastLoginAt: row.lastLoginAt ?? undefined,
  };
}

export class B2BUserRepositoryImpl implements B2BUserRepository {
  async findById(userId: string): Promise<B2BUser | null> {
    const row = await queryOne<DbB2bUser>(`SELECT * FROM "b2bUser" WHERE "userId" = $1`, [userId]);
    return row ? B2BUser.reconstitute(rowToProps(row)) : null;
  }

  async findByEmail(email: string, companyId: string): Promise<B2BUser | null> {
    const row = await queryOne<DbB2bUser>(`SELECT * FROM "b2bUser" WHERE "email" = $1 AND "companyId" = $2`, [email, companyId]);
    return row ? B2BUser.reconstitute(rowToProps(row)) : null;
  }

  async findByCompanyId(companyId: string): Promise<B2BUser[]> {
    const rows = await query<DbB2bUser[]>(`SELECT * FROM "b2bUser" WHERE "companyId" = $1 ORDER BY "createdAt" DESC`, [companyId]);
    return (rows ?? []).map(r => B2BUser.reconstitute(rowToProps(r)));
  }

  async findByOrganizationId(organizationId: string): Promise<B2BUser[]> {
    const rows = await query<DbB2bUser[]>(`SELECT * FROM "b2bUser" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`, [
      organizationId,
    ]);
    return (rows ?? []).map(r => B2BUser.reconstitute(rowToProps(r)));
  }

  async save(user: B2BUser): Promise<void> {
    const json = user.toJSON();
    await query(
      `INSERT INTO "b2bUser" (
        "userId", "companyId", "organizationId", "email", "firstName", "lastName",
        "role", "status", "spendingLimits", "department", "costCenter",
        "invitedAt", "activatedAt", "lastLoginAt", "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT ("userId") DO UPDATE SET
        "email" = EXCLUDED."email",
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        "role" = EXCLUDED."role",
        "status" = EXCLUDED."status",
        "spendingLimits" = EXCLUDED."spendingLimits",
        "department" = EXCLUDED."department",
        "costCenter" = EXCLUDED."costCenter",
        "activatedAt" = EXCLUDED."activatedAt",
        "lastLoginAt" = EXCLUDED."lastLoginAt",
        "updatedAt" = EXCLUDED."updatedAt"
      `,
      [
        json.userId,
        json.companyId,
        json.organizationId,
        json.email,
        json.firstName ?? null,
        json.lastName ?? null,
        json.role,
        json.status,
        JSON.stringify(json.spendingLimits),
        json.department ?? null,
        json.costCenter ?? null,
        json.invitedAt,
        json.activatedAt ?? null,
        json.lastLoginAt ?? null,
        json.createdAt,
        json.updatedAt,
      ],
    );
  }

  async delete(userId: string): Promise<void> {
    await query(`DELETE FROM "b2bUser" WHERE "userId" = $1`, [userId]);
  }
}
