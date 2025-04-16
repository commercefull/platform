import { queryOne } from "../../../libs/db";
import { Profile, ProfileProps } from "../domain/profile";

// Database transformation utilities
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}

function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords) return [];
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}

// Field mapping dictionary for profiles
const profileFields: Record<string, string> = {
  profileId: 'profile_id',
  userId: 'user_id',
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  city: 'city',
  state: 'state',
  zip: 'zip',
  country: 'country',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

export type ProfileCreateProps = Pick<ProfileProps, 'userId' | 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'city' | 'state' | 'zip' | 'country'>;
export type ProfileUpdateProps = Pick<ProfileProps, 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'city' | 'state' | 'zip' | 'country'>;

export class ProfileRepo {

  async create(props: ProfileCreateProps): Promise<Profile> {
    const {
      userId,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      country,
    } = props;

    const query = `
      INSERT INTO "public"."profile" (
        "user_id", "first_name", "last_name", "email", "phone", "address", "city", "state", "zip", "country"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
    `;

    const dbRecord = await queryOne(query, [
      userId,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      country,
    ]);

    if (!dbRecord) {
      throw new Error('Profile not saved');
    }

    return transformDbToTs<Profile>(dbRecord, profileFields);
  }

  async update(props: ProfileUpdateProps, profileId: string): Promise<Profile> {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      country,
    } = props;

    const query = `
      UPDATE "public"."profile"
      SET "first_name" = $1, "last_name" = $2, "email" = $3, "phone" = $4, "address" = $5, "city" = $6, "state" = $7, "zip" = $8, "country" = $9
      WHERE "profile_id" = $10
      RETURNING *;
    `;

    const dbRecord = await queryOne(query, [
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      country,
      profileId,
    ]);

    if (!dbRecord) {
      throw new Error('Profile not found');
    }

    return transformDbToTs<Profile>(dbRecord, profileFields);
  }

  async getByProfileId(profileId: string): Promise<Profile | null> {
    const query = `
      SELECT * FROM "public"."profile"
      WHERE "profile_id" = $1;
    `;

    const dbRecord = await queryOne(query, [profileId]);
    
    if (!dbRecord) {
      return null;
    }
    
    return transformDbToTs<Profile>(dbRecord, profileFields);
  }

  async getByUserId(userId: string): Promise<Profile | null> {
    const query = `
      SELECT * FROM "public"."profile"
      WHERE "user_id" = $1;
    `;

    const dbRecord = await queryOne(query, [userId]);
    
    if (!dbRecord) {
      return null;
    }
    
    return transformDbToTs<Profile>(dbRecord, profileFields);
  }

  async delete(profileId: string): Promise<void> {
    const query = `
      DELETE FROM "public"."profile"
      WHERE "profile_id" = $1;
    `;

    await queryOne(query, [profileId]);
  }
}