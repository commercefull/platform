
import { unixTimestamp } from "../../../libs/date";
import { queryOne } from "../../../libs/db";
import { Profile } from "../domain/profile";


export type ProfileCreateProps = Pick<Profile, 'userId' | 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'city' | 'state' | 'zip' | 'country'>;

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

  async update(props: AppointmentPatientBodyChartUpdateProps, appointmentPatientBodyChartId: string): Promise<AppointmentPatientBodyChart> {
    const {
      name,
      description,
      updatedBy,
    } = props;

    const query = `
      UPDATE "public"."appointmentPatientBodyChart"
      SET "name" = $1, "description" = $2, "updatedBy" = $3, "updatedAt" = $4
      WHERE "appointmentPatientBodyChartId" = $5
      RETURNING *;
    `;

    const data = await queryOne<AppointmentPatientBodyChart>(query, [
      name,
      description,
      updatedBy,
      unixTimestamp(),
      appointmentPatientBodyChartId,
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