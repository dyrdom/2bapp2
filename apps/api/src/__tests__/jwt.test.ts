import { describe, expect, it } from 'vitest';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js';

describe('jwt utils', () => {
  it('creates and verifies access token', () => {
    const token = signAccessToken('user-1');
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe('user-1');
  });

  it('creates and verifies refresh token', () => {
    const token = signRefreshToken('user-2');
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe('user-2');
  });
});
