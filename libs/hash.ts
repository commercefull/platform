import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashAString = (string: string) => {
  return bcrypt.hashSync(string, bcrypt.genSaltSync(SALT_ROUNDS));
};

export const hashString = (value: string, saltRounds: number = SALT_ROUNDS): Promise<string> => {
  return bcrypt.hash(value, saltRounds);
};

export const compareString = (value: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(value, hash);
};
