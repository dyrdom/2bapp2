import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';
import { AuthRequest } from '../types.js';

const router = Router();
router.use(requireAuth);

router.get('/search', async (req: AuthRequest, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) return res.json([]);

  const users = await prisma.user.findMany({
    where: {
      id: { not: req.user!.userId },
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: { id: true, username: true, email: true, status: true },
    take: 10,
  });

  return res.json(users);
});

export default router;
