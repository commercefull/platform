import { query, queryOne } from '../../../../libs/db';
import { B2BUser, B2BUserProps } from '../../domain/entities/B2BUser';
import type { B2BUserRepository } from '../../domain/repositories/B2BRepository';

export class B2BUserRepositoryImpl implements B2BUserRepository {
  async findById(userId: string): Promise<B2BUser | null> {
    const row = await queryOne<B2BUserProps>(
      `SELECT * FROM "b2bUser" WHERE "userId" = $1`,
      [userId],
    );
    return row ? B2BUser.reconstitute(row) : null;
  }

  async findByEmail(email: string, companyId: string): Promise<B2BUser | null> {
    const row = await queryOne<B2BUserProps>(
      `SELECT * FROM "b2bUser" WHERE "email" = $1 AND "companyId" = $2`,
      [email, companyId],
    );
    return row ? B2BUser.reconstitute(row) : null;
  }

  async findByCompanyId(companyId: string): Promise<B2BUser[]> {
    const rows = await query<B2BUserProps[]>(
      `SELECT * FROM "b2bUser" WHERE "companyId" = $1 ORDER BY "createdAt" DESC`,
      [companyId],
    );
    return (rows ?? []).map(r => B2BUser.reconstitute(r));
  }

  async findByOrganizationId(organizationId: string): Promise<B2BUser[]> {
    const rows = await query<B2BUserProps[]>(
      `SELECT * FROM "b2bUser" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`,
      [organizationId],
    );
    return (rows ?? []).map(r => B2BUser.reconstitute(r));
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
        json.userId, json.companyId, json.organizationId, json.email,
        json.firstName ?? null, json.lastName ?? null, json.role, json.status,
        JSON.stringify(json.spendingLimits), json.department ?? null,
        json.costCenter ?? null, json.invitedAt, json.activatedAt ?? null,
        json.lastLoginAt ?? null, json.createdAt, json.updatedAt,
      ],
    );
  }

  async delete(userId: string): Promise<void> {
    await query(`DELETE FROM "b2bUser" WHERE "userId" = $1`, [userId]);
  }
}
