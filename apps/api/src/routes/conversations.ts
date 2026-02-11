import { Server } from 'socket.io';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';
import { prisma } from '../utils/prisma.js';

export const createConversationsRouter = (io: Server) => {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const conversations = await prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, username: true, status: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const withUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const read = await prisma.readReceipt.findFirst({
          where: { conversationId: conversation.id, userId },
          orderBy: { readAt: 'desc' },
        });
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            ...(read ? { createdAt: { gt: read.readAt } } : {}),
          },
        });

        return { ...conversation, unreadCount };
      }),
    );

    res.json(withUnread);
  });

  router.post('/direct', async (req: AuthRequest, res) => {
    const payload = z.object({ targetUserId: z.string() }).safeParse(req.body);
    if (!payload.success) return res.status(400).json({ error: 'Invalid payload' });

    const userId = req.user!.userId;
    const targetUserId = payload.data.targetUserId;

    const all = await prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: { members: true },
    });

    const existing = all.find((c) => {
      const ids = c.members.map((m) => m.userId).sort();
      return ids.length === 2 && ids[0] !== ids[1] && ids.includes(userId) && ids.includes(targetUserId);
    });

    if (existing) return res.json(existing);

    const conversation = await prisma.conversation.create({
      data: {
        members: {
          createMany: {
            data: [{ userId }, { userId: targetUserId }],
          },
        },
      },
      include: { members: true },
    });

    io.to(targetUserId).emit('message:new', { conversationId: conversation.id, messageId: '' });
    return res.status(201).json(conversation);
  });

  return router;
};
