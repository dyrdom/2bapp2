import { describe, expect, it, vi } from 'vitest';
import { requireAuth } from '../middleware/auth.js';
import { signAccessToken } from '../utils/jwt.js';

const createRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('requireAuth middleware', () => {
  it('returns 401 without authorization header', () => {
    const req: any = { headers: {} };
    const res = createRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with invalid token', () => {
    const req: any = { headers: { authorization: 'Bearer nope' } };
    const res = createRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets user for valid token', () => {
    const token = signAccessToken('user-55');
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.userId).toBe('user-55');
  });
});
