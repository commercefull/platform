import bcrypt from 'bcryptjs';

export const hashAString = (string: string) => {
  return bcrypt.hashSync(string, bcrypt.genSaltSync(5));
};

export const validStringToHash = function (string: string, hashOfAString: string) {
  if (string != null) {
    return bcrypt.compareSync(string, hashOfAString);
  } else {
    return false;
  }
};
