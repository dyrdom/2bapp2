import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const router = Router();

const authSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24).optional(),
  password: z.string().min(6),
});

router.post('/register', async (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success || !parsed.data.username) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const { email, password, username } = parsed.data;
  const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (exists) return res.status(409).json({ error: 'User already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, passwordHash, status: 'online' },
  });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await prisma.user.update({ data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) }, where: { id: user.id } });

  return res.json({ accessToken, refreshToken, user: { id: user.id, username: user.username, email: user.email } });
});

router.post('/login', async (req, res) => {
  const parsed = authSchema.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10), status: 'online' } });

  return res.json({ accessToken, refreshToken, user: { id: user.id, username: user.username, email: user.email } });
});

router.post('/refresh', async (req, res) => {
  const token = req.body?.refreshToken as string | undefined;
  if (!token) return res.status(400).json({ error: 'Refresh token required' });

  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user?.refreshTokenHash || !(await bcrypt.compare(token, user.refreshTokenHash))) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = signAccessToken(user.id);
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.body?.refreshToken as string | undefined;
  if (!token) return res.status(200).json({ ok: true });

  try {
    const payload = verifyRefreshToken(token);
    await prisma.user.update({ where: { id: payload.userId }, data: { refreshTokenHash: null, status: 'invisible' } });
  } catch {
    // ignore invalid logout tokens for idempotency
  }
  return res.status(200).json({ ok: true });
});

export default router;
