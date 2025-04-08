
import { queryOne } from "../../../libs/db";
import { Profile, ProfileProps } from "../domain/profile";

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
        "userId", "firstName", "lastName", "email", "phone", "address", "city", "state", "zip", "country"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
    `;

    const data = await queryOne<Profile>(query, [
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

    if (!data) {
      throw new Error('profile not saved')
    }

    return data
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
      SET "firstName" = $1, "lastName" = $2, "email" = $3, "phone" = $4, "address" = $5, "city" = $6, "state" = $7, "zip" = $8, "country" = $9
      WHERE "profileId" = $12
      RETURNING *;
    `;

    const data = await queryOne<Profile>(query, [
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

    if (!data) {
      throw new Error('appointmentPatientBodyChart not found')
    }

    return data
  }

  async delete(appointmentPatientBodyChartId: string): Promise<void> {
    const query = `
      DELETE FROM "public"."appointmentPatientBodyChart"
      WHERE "appointmentPatientBodyChartId" = $1;
    `;

    await queryOne(query, [
      appointmentPatientBodyChartId,
    ]);
  }

}