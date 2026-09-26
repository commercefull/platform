import jwt from 'jsonwebtoken';
import { generateAccessToken, verifyAccessToken } from './jwtHelpers';

const SECRET = 'a-test-secret-that-is-at-least-32-chars-long';

describe('jwtHelpers', () => {
  it('should mark tokens as access tokens by default', () => {
    const token = generateAccessToken('user-1', 'u@test.com', 'customer', SECRET, '1h');

    expect(verifyAccessToken(token, SECRET)?.tokenUse).toBe('access');
  });

  it('should mark refresh tokens with tokenUse refresh when requested', () => {
    const token = generateAccessToken('user-1', 'u@test.com', 'customer', SECRET, '30d', 'refresh');

    expect(verifyAccessToken(token, SECRET)?.tokenUse).toBe('refresh');
  });

  it('should reject tokens signed with a non-HS256 algorithm', () => {
    const token = jwt.sign({ id: 'user-1' }, SECRET, { algorithm: 'HS512' });

    expect(verifyAccessToken(token, SECRET)).toBeNull();
  });
});
