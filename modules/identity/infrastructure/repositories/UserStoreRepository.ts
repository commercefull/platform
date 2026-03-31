import { query, queryOne } from '../../../../libs/db';
import { UserStoreAssignment } from '../../domain/entities/UserStoreAssignment';
import { UserStoreRepository as IUserStoreRepository } from '../../domain/repositories/UserStoreRepository';

export class UserStoreRepository implements IUserStoreRepository {
  private readonly tableName = 'userStore';

  async findByUserId(userId: string): Promise<UserStoreAssignment[]> {
    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "${this.tableName}" WHERE "userId" = $1 ORDER BY "isPrimary" DESC, "createdAt" ASC`,
      [userId],
    );

    return (rows || []).map(row => this.mapToAssignment(row));
  }

  async findByStoreId(storeId: string): Promise<UserStoreAssignment[]> {
    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "${this.tableName}" WHERE "storeId" = $1 ORDER BY "isPrimary" DESC, "createdAt" ASC`,
      [storeId],
    );

    return (rows || []).map(row => this.mapToAssignment(row));
  }

  async findByUserAndStore(userId: string, storeId: string): Promise<UserStoreAssignment | null> {
    const row = await queryOne<Record<string, any>>(
      `SELECT * FROM "${this.tableName}" WHERE "userId" = $1 AND "storeId" = $2`,
      [userId, storeId],
    );

    return row ? this.mapToAssignment(row) : null;
  }

  async findPrimaryStore(userId: string): Promise<UserStoreAssignment | null> {
    const row = await queryOne<Record<string, any>>(
      `SELECT * FROM "${this.tableName}" WHERE "userId" = $1 AND "isPrimary" = true ORDER BY "createdAt" ASC LIMIT 1`,
      [userId],
    );

    return row ? this.mapToAssignment(row) : null;
  }

  async save(assignment: UserStoreAssignment): Promise<UserStoreAssignment> {
    const existing = await queryOne<Record<string, any>>(
      `SELECT "userStoreId" FROM "${this.tableName}" WHERE "userStoreId" = $1`,
      [assignment.userStoreId],
    );

    const payload = assignment.toJSON();

    if (payload.isPrimary) {
      await query(
        `UPDATE "${this.tableName}" SET "isPrimary" = false, "updatedAt" = NOW() WHERE "userId" = $1 AND "userStoreId" <> $2`,
        [payload.userId, payload.userStoreId],
      );
    }

    if (existing) {
      await query(
        `UPDATE "${this.tableName}" SET
          "userId" = $1,
          "storeId" = $2,
          "role" = $3,
          "isPrimary" = $4,
          "isActive" = $5,
          "permissions" = $6,
          "updatedAt" = $7
        WHERE "userStoreId" = $8`,
        [
          payload.userId,
          payload.storeId,
          payload.role,
          payload.isPrimary,
          payload.isActive,
          JSON.stringify(payload.permissions),
          payload.updatedAt,
          payload.userStoreId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "${this.tableName}" (
          "userStoreId", "userId", "storeId", "role", "isPrimary", "isActive", "permissions", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          payload.userStoreId,
          payload.userId,
          payload.storeId,
          payload.role,
          payload.isPrimary,
          payload.isActive,
          JSON.stringify(payload.permissions),
          payload.createdAt,
          payload.updatedAt,
        ],
      );
    }

    return (await this.findByUserAndStore(payload.userId, payload.storeId)) as UserStoreAssignment;
  }

  async delete(userStoreId: string): Promise<void> {
    await query(`DELETE FROM "${this.tableName}" WHERE "userStoreId" = $1`, [userStoreId]);
  }

  private mapToAssignment(row: Record<string, any>): UserStoreAssignment {
    return UserStoreAssignment.reconstitute({
      userStoreId: row.userStoreId,
      userId: row.userId,
      storeId: row.storeId,
      role: row.role,
      isPrimary: Boolean(row.isPrimary),
      isActive: Boolean(row.isActive),
      permissions: Array.isArray(row.permissions)
        ? row.permissions
        : row.permissions
          ? JSON.parse(row.permissions)
          : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}

export default new UserStoreRepository();
