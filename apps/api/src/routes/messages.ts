import { Server } from 'socket.io';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';
import { prisma } from '../utils/prisma.js';

const reactionSchema = z.object({ emoji: z.enum(['👍', '❤️', '😂']) });

export const createMessagesRouter = (io: Server) => {
  const router = Router();
  router.use(requireAuth);

  router.get('/:conversationId', async (req: AuthRequest, res) => {
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const take = 20;

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.conversationId },
      include: {
        sender: { select: { id: true, username: true } },
        reactions: { select: { id: true, emoji: true, userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    res.json({ items: messages.reverse(), nextCursor: messages.length === take ? messages[take - 1].id : null });
  });

  router.post('/', async (req: AuthRequest, res) => {
    const parsed = z
      .object({ conversationId: z.string(), content: z.string().min(1).max(4000) })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

    const userId = req.user!.userId;
    const message = await prisma.message.create({
      data: { ...parsed.data, senderId: userId },
      include: { sender: { select: { id: true, username: true } }, reactions: true },
    });

    io.to(parsed.data.conversationId).emit('message:new', {
      conversationId: parsed.data.conversationId,
      messageId: message.id,
    });

    res.status(201).json(message);
  });

  router.patch('/:messageId', async (req: AuthRequest, res) => {
    const parsed = z.object({ content: z.string().min(1).max(4000) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

    const existing = await prisma.message.findUnique({ where: { id: req.params.messageId } });
    if (!existing || existing.senderId !== req.user!.userId) return res.status(403).json({ error: 'Forbidden' });

    const message = await prisma.message.update({
      where: { id: existing.id },
      data: { content: parsed.data.content },
    });

    io.to(existing.conversationId).emit('message:edit', {
      conversationId: existing.conversationId,
      messageId: message.id,
      content: message.content,
    });

    res.json(message);
  });

  router.delete('/:messageId', async (req: AuthRequest, res) => {
    const existing = await prisma.message.findUnique({ where: { id: req.params.messageId } });
    if (!existing || existing.senderId !== req.user!.userId) return res.status(403).json({ error: 'Forbidden' });

    await prisma.message.update({ where: { id: existing.id }, data: { isDeleted: true, content: 'Сообщение удалено' } });
    io.to(existing.conversationId).emit('message:delete', { conversationId: existing.conversationId, messageId: existing.id });
    res.status(204).send();
  });

  router.post('/:messageId/reactions', async (req: AuthRequest, res) => {
    const parsed = reactionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' });

    const message = await prisma.message.findUnique({ where: { id: req.params.messageId } });
    if (!message) return res.status(404).json({ error: 'Not found' });

    const reaction = await prisma.reaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId: req.params.messageId,
          userId: req.user!.userId,
          emoji: parsed.data.emoji,
        },
      },
      create: {
        emoji: parsed.data.emoji,
        messageId: req.params.messageId,
        userId: req.user!.userId,
      },
      update: {},
    });

    io.to(message.conversationId).emit('message:edit', {
      conversationId: message.conversationId,
      messageId: message.id,
      content: message.content,
    });
    res.status(201).json(reaction);
  });

  router.post('/:conversationId/read', async (req: AuthRequest, res) => {
    const latest = await prisma.message.findFirst({
      where: { conversationId: req.params.conversationId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) return res.status(200).json({ ok: true });

    await prisma.readReceipt.upsert({
      where: {
        conversationId_userId_messageId: {
          conversationId: req.params.conversationId,
          userId: req.user!.userId,
          messageId: latest.id,
        },
      },
      create: {
        conversationId: req.params.conversationId,
        userId: req.user!.userId,
        messageId: latest.id,
      },
      update: { readAt: new Date() },
    });

    io.to(req.params.conversationId).emit('read_receipt', {
      conversationId: req.params.conversationId,
      userId: req.user!.userId,
      messageId: latest.id,
    });

    return res.json({ ok: true });
  });

  return router;
};
