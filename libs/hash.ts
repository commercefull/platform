import bcrypt from 'bcryptjs';

export const hashAString = (string: string) => {
  return bcrypt.hashSync(string, bcrypt.genSaltSync(5));
};

