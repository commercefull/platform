export type ProfileProps = {
  profileId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export class Profile {
  constructor(
    private readonly profileId: string,
    private readonly userId: string,
    private readonly firstName: string,
    private readonly lastName: string,
    private readonly email: string,
    private readonly phone: string,
    private readonly address: string,
    private readonly city: string,
    private readonly state: string,
    private readonly zip: string,
    private readonly country: string,
  ) {}
}
